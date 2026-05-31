import { supabase } from '../lib/supabaseClient'
import { getFollowCounts } from './follows'
import type {
  CreatorDashboardData,
  CreatorDashboardRecentComment,
  CreatorDashboardTopRecipe,
  CreatorProfileCompleteness,
} from '../types/CreatorDashboard'

type PublicRecipeRow = {
  id: number
  title: string
  created_at: string
}

type LikeCountRow = {
  recipe_id: number | null
  like_count: number | null
}

type CommentCountRow = {
  recipe_id: number
}

type RecentCommentAuthor = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type RecentCommentRow = {
  id: string
  recipe_id: number
  content: string
  created_at: string
  user_id: string
  author?: RecentCommentAuthor | RecentCommentAuthor[] | null
}

type ProfileRow = {
  display_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
}

const RECENT_COMMENT_LIMIT = 10

function daysAgoIso(days: number): string {
  const now = Date.now()
  const daysMs = days * 24 * 60 * 60 * 1000
  return new Date(now - daysMs).toISOString()
}

function getAuthor(row: RecentCommentRow): RecentCommentAuthor | null {
  const author = row.author
  if (!author) return null
  return Array.isArray(author) ? (author[0] ?? null) : author
}

function getAuthorDisplayName(author: RecentCommentAuthor | null): string {
  const displayName = author?.display_name?.trim()
  if (displayName) return displayName
  const username = author?.username?.trim()
  if (username) return `@${username}`
  return 'Savora member'
}

function computeProfileCompleteness(profile: ProfileRow | null): CreatorProfileCompleteness {
  const totalFields = 4

  if (!profile) {
    return {
      score: 0,
      completedFields: 0,
      totalFields,
    }
  }

  const completedFields = [
    profile.display_name,
    profile.username,
    profile.bio,
    profile.avatar_url,
  ].filter((value) => Boolean(value && value.trim().length > 0)).length

  return {
    score: Math.round((completedFields / totalFields) * 100),
    completedFields,
    totalFields,
  }
}

function emptyDashboardData(profileCompleteness: CreatorProfileCompleteness): CreatorDashboardData {
  return {
    kpis: {
      publicRecipesCount: 0,
      totalLikesReceived: 0,
      totalCommentsReceived: 0,
      followersCount: 0,
      newFollowers7d: 0,
      newFollowers30d: 0,
      recipesPublished7d: 0,
      recipesPublished30d: 0,
    },
    topRecipes: [],
    recentComments: [],
    profileCompleteness,
    hasPublicRecipes: false,
  }
}

export async function getCreatorDashboard(userId: string): Promise<CreatorDashboardData> {
  const trimmedUserId = userId.trim()
  if (!trimmedUserId) {
    throw new Error('A valid user id is required.')
  }

  const since7d = daysAgoIso(7)
  const since30d = daysAgoIso(30)

  const [publicRecipesResult, followCounts, followers7dResult, followers30dResult, profileResult] =
    await Promise.all([
      supabase
        .from('recipes')
        .select('id, title, created_at')
        .eq('user_id', trimmedUserId)
        .eq('is_public', true),
      getFollowCounts(trimmedUserId),
      supabase
        .from('follows')
        .select('id', { head: true, count: 'exact' })
        .eq('following_id', trimmedUserId)
        .gte('created_at', since7d),
      supabase
        .from('follows')
        .select('id', { head: true, count: 'exact' })
        .eq('following_id', trimmedUserId)
        .gte('created_at', since30d),
      supabase
        .from('profiles')
        .select('display_name, username, bio, avatar_url')
        .eq('id', trimmedUserId)
        .maybeSingle(),
    ])

  if (publicRecipesResult.error) throw publicRecipesResult.error
  if (followers7dResult.error) throw followers7dResult.error
  if (followers30dResult.error) throw followers30dResult.error
  if (profileResult.error) throw profileResult.error

  const profileCompleteness = computeProfileCompleteness(
    (profileResult.data as ProfileRow | null) ?? null
  )

  const publicRecipes = (publicRecipesResult.data ?? []) as PublicRecipeRow[]
  if (publicRecipes.length === 0) {
    const empty = emptyDashboardData(profileCompleteness)
    return {
      ...empty,
      kpis: {
        ...empty.kpis,
        followersCount: followCounts.followers,
        newFollowers7d: followers7dResult.count ?? 0,
        newFollowers30d: followers30dResult.count ?? 0,
      },
    }
  }

  const recipeIds = publicRecipes
    .map((recipe) => Number(recipe.id))
    .filter((id) => Number.isFinite(id) && id > 0)

  if (recipeIds.length === 0) {
    const empty = emptyDashboardData(profileCompleteness)
    return {
      ...empty,
      kpis: {
        ...empty.kpis,
        followersCount: followCounts.followers,
        newFollowers7d: followers7dResult.count ?? 0,
        newFollowers30d: followers30dResult.count ?? 0,
      },
    }
  }

  const [likeCountsResult, commentCountsResult, recentCommentsResult] = await Promise.all([
    supabase
      .from('recipe_like_counts')
      .select('recipe_id, like_count')
      .in('recipe_id', recipeIds),
    supabase
      .from('comments')
      .select('recipe_id')
      .in('recipe_id', recipeIds),
    supabase
      .from('comments')
      .select(
        'id, recipe_id, user_id, content, created_at, author:profiles!comments_user_id_fkey(username, display_name, avatar_url)'
      )
      .in('recipe_id', recipeIds)
      .order('created_at', { ascending: false })
      .limit(RECENT_COMMENT_LIMIT),
  ])

  if (likeCountsResult.error) throw likeCountsResult.error
  if (commentCountsResult.error) throw commentCountsResult.error
  if (recentCommentsResult.error) throw recentCommentsResult.error

  const likeCountsRows = (likeCountsResult.data ?? []) as LikeCountRow[]
  const commentCountRows = (commentCountsResult.data ?? []) as CommentCountRow[]
  const recentCommentRows = (recentCommentsResult.data ?? []) as RecentCommentRow[]

  const likesByRecipeId: Record<number, number> = {}
  for (const recipeId of recipeIds) {
    likesByRecipeId[recipeId] = 0
  }
  for (const row of likeCountsRows) {
    const recipeId = Number(row.recipe_id)
    const likeCount = Number(row.like_count ?? 0)
    if (Number.isFinite(recipeId) && recipeId > 0) {
      likesByRecipeId[recipeId] = Number.isFinite(likeCount) ? likeCount : 0
    }
  }

  const commentsByRecipeId: Record<number, number> = {}
  for (const recipeId of recipeIds) {
    commentsByRecipeId[recipeId] = 0
  }
  for (const row of commentCountRows) {
    const recipeId = Number(row.recipe_id)
    if (Number.isFinite(recipeId) && recipeId > 0) {
      commentsByRecipeId[recipeId] = (commentsByRecipeId[recipeId] ?? 0) + 1
    }
  }

  const recipesPublished7d = publicRecipes.filter(
    (recipe) => Date.parse(recipe.created_at) >= Date.parse(since7d)
  ).length
  const recipesPublished30d = publicRecipes.filter(
    (recipe) => Date.parse(recipe.created_at) >= Date.parse(since30d)
  ).length

  const totalLikesReceived = Object.values(likesByRecipeId).reduce(
    (sum, count) => sum + count,
    0
  )
  const totalCommentsReceived = commentCountRows.length

  const topRecipes: CreatorDashboardTopRecipe[] = [...publicRecipes]
    .sort((a, b) => {
      const likeDelta = (likesByRecipeId[b.id] ?? 0) - (likesByRecipeId[a.id] ?? 0)
      if (likeDelta !== 0) return likeDelta

      const commentDelta =
        (commentsByRecipeId[b.id] ?? 0) - (commentsByRecipeId[a.id] ?? 0)
      if (commentDelta !== 0) return commentDelta

      return Date.parse(b.created_at) - Date.parse(a.created_at)
    })
    .slice(0, 5)
    .map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      publishedAt: recipe.created_at,
      likeCount: likesByRecipeId[recipe.id] ?? 0,
      commentCount: commentsByRecipeId[recipe.id] ?? 0,
    }))

  const recipeTitleById: Record<number, string> = {}
  for (const recipe of publicRecipes) {
    recipeTitleById[recipe.id] = recipe.title
  }

  const recentComments: CreatorDashboardRecentComment[] = recentCommentRows
    .map((row) => {
      const author = getAuthor(row)
      return {
        id: row.id,
        recipeId: row.recipe_id,
        recipeTitle: recipeTitleById[row.recipe_id] ?? 'Recipe',
        content: row.content,
        createdAt: row.created_at,
        authorDisplayName: getAuthorDisplayName(author),
        authorUsername: author?.username ?? null,
        authorAvatarUrl: author?.avatar_url ?? null,
      }
    })
    .filter((comment) => Boolean(recipeTitleById[comment.recipeId]))

  return {
    kpis: {
      publicRecipesCount: publicRecipes.length,
      totalLikesReceived,
      totalCommentsReceived,
      followersCount: followCounts.followers,
      newFollowers7d: followers7dResult.count ?? 0,
      newFollowers30d: followers30dResult.count ?? 0,
      recipesPublished7d,
      recipesPublished30d,
    },
    topRecipes,
    recentComments,
    profileCompleteness,
    hasPublicRecipes: publicRecipes.length > 0,
  }
}
