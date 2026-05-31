import { supabase } from '../lib/supabaseClient'
import { getFollowingIds } from './follows'
import type {
  ActivityActor,
  ActivityEvent,
  ActivityFeedResult,
  ActivityRecipeRef,
  ActivityUserRef,
} from '../types/ActivityEvent'

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type RecipeRow = {
  id: number
  title: string
  user_id: string
  created_at: string
}

type LikeRow = {
  recipe_id: number
  user_id: string
  created_at: string
}

type CommentRow = {
  id: string
  recipe_id: number
  user_id: string
  content: string
  created_at: string
}

const DEFAULT_LIMIT_PER_TYPE = 30
const DEFAULT_MAX_EVENTS = 120
const GROUP_WINDOW_MS = 15 * 60 * 1000

function toDisplayName(profile?: ProfileRow): string {
  const displayName = profile?.display_name?.trim()
  if (displayName) return displayName
  const username = profile?.username?.trim()
  if (username) return `@${username}`
  return 'Savora member'
}

function toActor(profile?: ProfileRow): ActivityActor {
  return {
    id: profile?.id ?? '',
    displayName: toDisplayName(profile),
    username: profile?.username ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  }
}

function toUserRef(profile?: ProfileRow): ActivityUserRef | null {
  if (!profile) return null
  return {
    id: profile.id,
    displayName: toDisplayName(profile),
    username: profile.username,
  }
}

function toRecipeRef(
  recipe: RecipeRow | undefined,
  profilesById: Map<string, ProfileRow>
): ActivityRecipeRef | null {
  if (!recipe) return null
  const authorProfile = profilesById.get(recipe.user_id)
  return {
    id: recipe.id,
    title: recipe.title,
    authorId: recipe.user_id,
    authorDisplayName: toDisplayName(authorProfile),
    authorUsername: authorProfile?.username ?? null,
  }
}

function truncateComment(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 140) return normalized
  return `${normalized.slice(0, 137)}...`
}

async function getProfilesByIds(ids: string[]): Promise<Map<string, ProfileRow>> {
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)

  if (error) throw error

  const map = new Map<string, ProfileRow>()
  for (const row of (data ?? []) as unknown as ProfileRow[]) {
    map.set(row.id, row)
  }
  return map
}

function dedupeEvents(events: ActivityEvent[]): ActivityEvent[] {
  const seen = new Set<string>()
  const output: ActivityEvent[] = []

  for (const event of events) {
    const fingerprint = [
      event.type,
      event.actor.id,
      event.recipe?.id ?? '',
      event.targetUser?.id ?? '',
      event.createdAt,
      event.commentPreview ?? '',
    ].join('|')

    if (seen.has(fingerprint)) continue
    seen.add(fingerprint)
    output.push(event)
  }

  return output
}

function groupEvents(events: ActivityEvent[]): ActivityEvent[] {
  const grouped: ActivityEvent[] = []

  for (const event of events) {
    const last = grouped[grouped.length - 1]
    if (!last) {
      grouped.push(event)
      continue
    }

    const sameActor = last.actor.id === event.actor.id
    const sameType = last.type === event.type

    if (!sameActor || !sameType) {
      grouped.push(event)
      continue
    }

    const lastTime = Date.parse(last.createdAt)
    const eventTime = Date.parse(event.createdAt)
    const withinWindow =
      Number.isFinite(lastTime) &&
      Number.isFinite(eventTime) &&
      lastTime - eventTime <= GROUP_WINDOW_MS

    if (!withinWindow) {
      grouped.push(event)
      continue
    }

    grouped[grouped.length - 1] = {
      ...last,
      groupCount: last.groupCount + 1,
      // Keep most recent timestamp and leading item metadata.
      createdAt: last.createdAt,
    }
  }

  return grouped
}

export async function getActivityFeedForUser(
  userId: string,
  options?: {
    limitPerType?: number
    maxEvents?: number
  }
): Promise<ActivityFeedResult> {
  const trimmedUserId = userId.trim()
  if (!trimmedUserId) {
    return { events: [], followingCount: 0 }
  }

  const followingIds = await getFollowingIds(trimmedUserId)
  const followingCount = followingIds.length

  if (followingCount === 0) {
    return { events: [], followingCount: 0 }
  }

  const limitPerType = options?.limitPerType ?? DEFAULT_LIMIT_PER_TYPE
  const maxEvents = options?.maxEvents ?? DEFAULT_MAX_EVENTS

  /**
   * RLS safety note:
   * We intentionally exclude follow events from the activity feed.
   *
   * Current follows SELECT policy only permits rows where the viewer is directly
   * involved (follower or following). Third-party follow rows from people you
   * follow are not reliably visible. Depending on them would cause silent gaps.
   *
   * To keep feed correctness under current policies, we only include recipe
   * posts, likes, and comments authored by followed users.
   */
  const [postRowsResult, likeRowsResult, commentRowsResult] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, title, user_id, created_at')
      .eq('is_public', true)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limitPerType),
    supabase
      .from('recipe_likes')
      .select('recipe_id, user_id, created_at')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limitPerType),
    supabase
      .from('comments')
      .select('id, recipe_id, user_id, content, created_at')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limitPerType),
  ])

  if (postRowsResult.error) throw postRowsResult.error
  if (likeRowsResult.error) throw likeRowsResult.error
  if (commentRowsResult.error) throw commentRowsResult.error

  const postRows = (postRowsResult.data ?? []) as unknown as RecipeRow[]
  const likeRows = (likeRowsResult.data ?? []) as unknown as LikeRow[]
  const commentRows = (commentRowsResult.data ?? []) as unknown as CommentRow[]

  const recipeIdsFromLikesAndComments = Array.from(
    new Set([
      ...likeRows.map((row) => row.recipe_id),
      ...commentRows.map((row) => row.recipe_id),
    ])
  )

  let publicRecipeRowsFromInteractions: RecipeRow[] = []
  if (recipeIdsFromLikesAndComments.length > 0) {
    const interactionRecipeResult = await supabase
      .from('recipes')
      .select('id, title, user_id, created_at')
      .eq('is_public', true)
      .in('id', recipeIdsFromLikesAndComments)

    if (interactionRecipeResult.error) throw interactionRecipeResult.error
    publicRecipeRowsFromInteractions = (interactionRecipeResult.data ??
      []) as unknown as RecipeRow[]
  }

  const recipesById = new Map<number, RecipeRow>()
  for (const row of postRows) recipesById.set(row.id, row)
  for (const row of publicRecipeRowsFromInteractions) recipesById.set(row.id, row)

  const profileIds = new Set<string>()
  for (const row of postRows) profileIds.add(row.user_id)
  for (const row of likeRows) profileIds.add(row.user_id)
  for (const row of commentRows) profileIds.add(row.user_id)
  for (const row of recipesById.values()) profileIds.add(row.user_id)

  const profilesById = await getProfilesByIds(Array.from(profileIds))

  const events: ActivityEvent[] = []

  for (const row of postRows) {
    const actorProfile = profilesById.get(row.user_id)
    events.push({
      id: `recipe_post:${row.id}:${row.created_at}`,
      type: 'recipe_post',
      createdAt: row.created_at,
      groupCount: 1,
      actor: {
        ...toActor(actorProfile),
        id: row.user_id,
      },
      recipe: toRecipeRef(row, profilesById),
      targetUser: null,
      commentPreview: null,
    })
  }

  for (const row of likeRows) {
    const recipe = recipesById.get(row.recipe_id)
    if (!recipe) continue

    const actorProfile = profilesById.get(row.user_id)
    const authorProfile = profilesById.get(recipe.user_id)

    events.push({
      id: `recipe_like:${row.user_id}:${row.recipe_id}:${row.created_at}`,
      type: 'recipe_like',
      createdAt: row.created_at,
      groupCount: 1,
      actor: {
        ...toActor(actorProfile),
        id: row.user_id,
      },
      recipe: toRecipeRef(recipe, profilesById),
      targetUser: toUserRef(authorProfile),
      commentPreview: null,
    })
  }

  for (const row of commentRows) {
    const recipe = recipesById.get(row.recipe_id)
    if (!recipe) continue

    const actorProfile = profilesById.get(row.user_id)
    const authorProfile = profilesById.get(recipe.user_id)

    events.push({
      id: `recipe_comment:${row.id}:${row.created_at}`,
      type: 'recipe_comment',
      createdAt: row.created_at,
      groupCount: 1,
      actor: {
        ...toActor(actorProfile),
        id: row.user_id,
      },
      recipe: toRecipeRef(recipe, profilesById),
      targetUser: toUserRef(authorProfile),
      commentPreview: truncateComment(row.content),
    })
  }

  const deduped = dedupeEvents(events)
  deduped.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const grouped = groupEvents(deduped)

  return {
    events: grouped.slice(0, maxEvents),
    followingCount,
  }
}
