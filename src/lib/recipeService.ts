import { supabase } from './supabaseClient'
import type { Database } from '../types/database'
import { normalizeSupabaseRecipeId } from '../utils/favorites'

type RecipeRow = Database['public']['Tables']['recipes']['Row']

/**
 * A recipes row plus the joined `author` shape returned by
 *   .select('*, author:profiles!recipes_user_id_fkey(username)')
 *
 * Supabase returns the join as a single object when the FK is unique and as an
 * array when it isn't, so we accept both. `author` is optional because plain
 * inserts/updates/refetches that don't request the join still satisfy this type.
 */
export type RecipeRowWithAuthor = RecipeRow & {
  author?:
    | { username: string | null }
    | { username: string | null }[]
    | null
}

const RECIPES_WITH_AUTHOR_SELECT =
  '*, author:profiles!recipes_user_id_fkey(username)'

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
 * current user. Includes the author's profile username via the joined select.
 */
export async function getCommunityRecipes(
  excludeUserId?: string
): Promise<RecipeRowWithAuthor[]> {
  let query = supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('is_public', true)

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as RecipeRowWithAuthor[]
}

export async function createRecipe(
  userId: string,
  recipe: RecipeCreateInput
): Promise<RecipeRow> {
  if (!userId) {
    throw new Error('createRecipe requires an authenticated user id')
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
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
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateRecipe(
  recipeId: number,
  userId: string,
  updates: RecipeUpdateInput
): Promise<RecipeRow> {
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
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
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
  // Fetch all likes for the given recipe IDs and compute counts per recipe.
  const { data, error } = await supabase
    .from('recipe_likes')
    .select('recipe_id')
    .in('recipe_id', recipeIds)

  if (error) throw error

  const rows = data ?? []
  const counts: Record<number, number> = {}
  for (const id of recipeIds) counts[id] = 0
  ;(rows as any[]).forEach((r) => {
    const id = r.recipe_id as number
    counts[id] = (counts[id] ?? 0) + 1
  })

  return counts
}

export async function getLikedRecipeIdsByUser(userId: string): Promise<number[]> {
  if (!userId) return []

  const { data, error } = await supabase
    .from('recipe_likes')
    .select('recipe_id')
    .eq('user_id', userId)

  if (error) throw error

  return (data ?? []).map((r: any) => Number(r.recipe_id))
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
      // Log full error for debugging
      console.error('Supabase likeRecipe error:', error)
      // If unique violation (already liked), treat as success
      const code = (error as any)?.code ?? (error as any)?.status
      if (code === '23505' || code === 409) return
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
      const code = (error as any)?.code ?? (error as any)?.status
      if (code === '23505' || code === 409) return
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