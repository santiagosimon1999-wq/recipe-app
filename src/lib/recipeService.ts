import { supabase } from './supabaseClient'
import type { Database } from '../types/database'
import { normalizeSupabaseRecipeId } from '../utils/favorites'

type RecipeRow = Database['public']['Tables']['recipes']['Row']

type AuthorJoin = {
  username: string | null
  display_name: string | null
}

/**
 * A recipes row plus the joined `author` shape returned by
 *   .select('*, author:profiles!recipes_author_id_fkey(username, display_name)')
 *
 * The FK hint must match the Postgres constraint name exactly — PostgREST
 * returns PGRST200 if the relationship is ambiguous or the wrong FK is named.
 *
 * Supabase returns the join as a single object when the FK is unique and as an
 * array when it isn't, so we accept both. `author` is optional because plain
 * inserts/updates/refetches that don't request the join still satisfy this type.
 */
export type RecipeRowWithAuthor = RecipeRow & {
  author?: AuthorJoin | AuthorJoin[] | null
}

export const RECIPES_WITH_AUTHOR_SELECT =
  '*, author:profiles!recipes_author_id_fkey(username, display_name)'

export type RecipeCreateInput = {
  title: string
  description?: string
  ingredients?: string[]
  instructions?: string
  category?: string
  image_url?: string | null
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  is_public?: boolean
}

export type RecipeUpdateInput = Partial<RecipeCreateInput>

export type CommunityRecipesOptions = {
  excludeUserId?: string
  /** Max rows to return. Default 20. */
  limit?: number
  /** Fetch rows with `created_at` strictly before this ISO timestamp (cursor pagination). */
  cursor?: string
  /** Only recipes from these user ids (e.g. people you follow). */
  authorUserIds?: string[]
}

const DEFAULT_COMMUNITY_PAGE_SIZE = 20

export const COMMUNITY_PAGE_SIZE = DEFAULT_COMMUNITY_PAGE_SIZE

function getPostgresErrorCode(error: unknown): string | number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const record = error as { code?: string; status?: number }
  return record.code ?? record.status
}

function isUniqueViolation(error: unknown): boolean {
  const code = getPostgresErrorCode(error)
  return code === '23505' || code === 409
}

export async function getRecipes(
  userId: string
): Promise<RecipeRowWithAuthor[]> {
  if (!userId) {
    throw new Error('getRecipes requires an authenticated user id')
  }

  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as RecipeRowWithAuthor[]
}

/**
 * Fetch public ("community") recipes, optionally excluding rows owned by the
 * current user. Supports cursor pagination via `created_at`.
 */
export async function getCommunityRecipes(
  options?: CommunityRecipesOptions
): Promise<RecipeRowWithAuthor[]> {
  const limit = options?.limit ?? DEFAULT_COMMUNITY_PAGE_SIZE

  let query = supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('is_public', true)

  if (options?.excludeUserId) {
    query = query.neq('user_id', options.excludeUserId)
  }

  if (options?.cursor) {
    query = query.lt('created_at', options.cursor)
  }

  if (options?.authorUserIds) {
    if (options.authorUserIds.length === 0) {
      return []
    }
    query = query.in('user_id', options.authorUserIds)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as RecipeRowWithAuthor[]
}

/**
 * Fetch a single recipe by id. Returns null if not found or not visible
 * (must be public, or owned by `viewerUserId` when provided).
 */
export async function getRecipeById(
  recipeId: number,
  viewerUserId?: string
): Promise<RecipeRowWithAuthor | null> {
  if (!Number.isFinite(recipeId) || recipeId <= 0) return null

  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('id', recipeId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as RecipeRowWithAuthor
  const isOwner = Boolean(viewerUserId && row.user_id === viewerUserId)
  const isPublic = row.is_public ?? false

  if (!isPublic && !isOwner) {
    return null
  }

  return row
}

export async function searchPublicRecipes(
  searchTerm: string,
  options?: { limit?: number; excludeUserId?: string }
): Promise<RecipeRowWithAuthor[]> {
  const trimmed = searchTerm.trim()
  if (!trimmed) return []

  const limit = options?.limit ?? 40
  const pattern = `%${trimmed.replace(/[%_]/g, '')}%`

  let query = supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('is_public', true)
    .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)

  if (options?.excludeUserId) {
    query = query.neq('user_id', options.excludeUserId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []) as unknown as RecipeRowWithAuthor[]
}

export async function createRecipe(
  userId: string,
  recipe: RecipeCreateInput
): Promise<RecipeRowWithAuthor> {
  if (!userId) {
    throw new Error('createRecipe requires an authenticated user id')
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      author_id: userId,
      title: recipe.title,
      description: recipe.description ?? '',
      ingredients: recipe.ingredients ?? [],
      instructions: recipe.instructions ?? '',
      category: recipe.category ?? 'Other',
      image_url: recipe.image_url ?? null,
      calories: recipe.calories ?? 0,
      protein: recipe.protein ?? 0,
      carbs: recipe.carbs ?? 0,
      fat: recipe.fat ?? 0,
      is_public: recipe.is_public ?? true,
    })
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as RecipeRowWithAuthor
}

export async function updateRecipe(
  recipeId: number,
  userId: string,
  updates: RecipeUpdateInput
): Promise<RecipeRowWithAuthor> {
  if (!userId) {
    throw new Error('updateRecipe requires an authenticated user id')
  }

  const payload: RecipeUpdateInput = {
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.description !== undefined
      ? { description: updates.description }
      : {}),
    ...(updates.ingredients !== undefined
      ? { ingredients: updates.ingredients }
      : {}),
    ...(updates.instructions !== undefined
      ? { instructions: updates.instructions }
      : {}),
    ...(updates.category !== undefined ? { category: updates.category } : {}),
    ...(updates.image_url !== undefined ? { image_url: updates.image_url } : {}),
    ...(updates.calories !== undefined ? { calories: updates.calories } : {}),
    ...(updates.protein !== undefined ? { protein: updates.protein } : {}),
    ...(updates.carbs !== undefined ? { carbs: updates.carbs } : {}),
    ...(updates.fat !== undefined ? { fat: updates.fat } : {}),
    ...(updates.is_public !== undefined ? { is_public: updates.is_public } : {}),
  }

  const { data, error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', recipeId)
    .eq('user_id', userId)
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as RecipeRowWithAuthor
}

export async function deleteRecipe(recipeId: number, userId: string): Promise<void> {
  if (!userId) {
    throw new Error('deleteRecipe requires an authenticated user id')
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

// Likes API
export async function getLikesCount(recipeId: number): Promise<number> {
  const { error, count } = await supabase
    .from('recipe_likes')
    .select('id', { count: 'exact', head: true })
    .eq('recipe_id', recipeId)

  if (error) throw error

  return count ?? 0
}

export async function getLikesCountsForRecipeIds(
  recipeIds: number[]
): Promise<Record<number, number>> {
  if (recipeIds.length === 0) return {}

  // Reads from the aggregated `recipe_like_counts` view (Phase 4.1) so the
  // client never has to count rows itself. One row returned per liked recipe.
  // Recipes with zero likes are absent from the view; we seed them to 0 below.
  const { data, error } = await supabase
    .from('recipe_like_counts')
    .select('recipe_id, like_count')
    .in('recipe_id', recipeIds)

  if (error) throw error

  const counts: Record<number, number> = {}
  for (const id of recipeIds) counts[id] = 0

  for (const row of data ?? []) {
    const recipeId = Number((row as { recipe_id: number }).recipe_id)
    const likeCount = Number((row as { like_count: number }).like_count)
    if (Number.isFinite(recipeId) && Number.isFinite(likeCount)) {
      counts[recipeId] = likeCount
    }
  }

  return counts
}

export async function getLikedRecipeIdsByUser(userId: string): Promise<number[]> {
  if (!userId) return []

  const { data, error } = await supabase
    .from('recipe_likes')
    .select('recipe_id')
    .eq('user_id', userId)

  if (error) throw error

  return (data ?? [])
    .map((row) => Number((row as { recipe_id: number }).recipe_id))
    .filter((id) => Number.isFinite(id) && id > 0)
}

export async function likeRecipe(
  userId: string,
  recipeId: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('recipe_likes')
      .insert({ user_id: userId, recipe_id: recipeId })

    if (error) {
      console.error('Supabase likeRecipe error:', error)
      if (isUniqueViolation(error)) return
      throw error
    }

    return
  } catch (err) {
    console.error('Failed to insert like:', err)
    throw err
  }
}

export async function unlikeRecipe(userId: string, recipeId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('recipe_likes')
      .delete()
      .match({ user_id: userId, recipe_id: recipeId })

    if (error) {
      console.error('Supabase unlikeRecipe error:', error)
      throw error
    }

    return
  } catch (err) {
    console.error('Failed to delete like:', err)
    throw err
  }
}

// Saved recipes (favorites)
export async function getSavedRecipeIdsByUser(userId: string): Promise<number[]> {
  if (!userId) return []

  const { data, error } = await supabase
    .from('saved_recipes')
    .select('recipe_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Supabase getSavedRecipeIdsByUser error:', error)
    throw error
  }

  return (data ?? [])
    .map((row) => Math.trunc(Number((row as { recipe_id: number | string }).recipe_id)))
    .filter((id) => Number.isFinite(id) && id > 0)
}

export async function saveRecipeForUser(userId: string, recipeId: number): Promise<void> {
  const dbRecipeId = normalizeSupabaseRecipeId(recipeId)

  try {
    const { error } = await supabase
      .from('saved_recipes')
      .insert({ user_id: userId, recipe_id: dbRecipeId })

    if (error) {
      console.error('Supabase saveRecipeForUser insert error:', {
        userId,
        recipeId: dbRecipeId,
        error,
      })
      if (isUniqueViolation(error)) return
      throw error
    }

    return
  } catch (err) {
    console.error('Failed to save recipe:', err)
    throw err
  }
}

export async function unsaveRecipeForUser(userId: string, recipeId: number): Promise<void> {
  const dbRecipeId = normalizeSupabaseRecipeId(recipeId)

  try {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .match({ user_id: userId, recipe_id: dbRecipeId })

    if (error) {
      console.error('Supabase unsaveRecipeForUser delete error:', {
        userId,
        recipeId: dbRecipeId,
        error,
      })
      throw error
    }

    return
  } catch (err) {
    console.error('Failed to unsave recipe:', err)
    throw err
  }
}