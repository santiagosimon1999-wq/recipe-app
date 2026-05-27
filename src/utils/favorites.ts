import type { Recipe } from '../types/Recipe'

export function isSampleRecipe(recipe: Recipe): boolean {
  return recipe.source === 'sample'
}

export function isCloudRecipe(recipe: Recipe): boolean {
  return recipe.source === 'user' || recipe.source === 'community'
}

/** Stable React key — sample id 5 and Supabase id 5 are different recipes. */
export function getRecipeListKey(recipe: Recipe): string {
  return `${recipe.source ?? 'unknown'}-${recipe.id}`
}

export function isRecipeFavorited(
  recipe: Recipe,
  sampleFavoriteIds: number[],
  cloudFavoriteRecipeIds: number[]
): boolean {
  if (isSampleRecipe(recipe)) {
    return sampleFavoriteIds.includes(recipe.id)
  }

  const dbId = parseDbRecipeId(recipe.id)
  if (dbId === null) {
    return false
  }

  return cloudFavoriteRecipeIds.includes(dbId)
}

/** Parse a Postgres/Supabase recipe primary key (bigint may arrive as string). */
export function parseDbRecipeId(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'bigint') {
    const asNumber = Number(value)
    if (!Number.isSafeInteger(asNumber) || asNumber <= 0) {
      return null
    }
    return asNumber
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!/^\d+$/.test(trimmed)) {
      return null
    }
    const id = Number.parseInt(trimmed, 10)
    return id > 0 ? id : null
  }

  const id = Math.trunc(Number(value))

  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

/** Supabase saved_recipes.recipe_id — must be a positive DB row id, never a sample id. */
export function getSupabaseRecipeId(recipe: Recipe): number | null {
  if (isSampleRecipe(recipe)) {
    return null
  }

  if (!isCloudRecipe(recipe)) {
    console.error(
      'Cannot resolve Supabase recipe id for non-cloud recipe:',
      recipe.source,
      recipe
    )
    return null
  }

  const id = parseDbRecipeId(recipe.id)

  if (id === null) {
    console.error(
      'Invalid Supabase recipe id for cloud favorite:',
      recipe.id,
      recipe
    )
    return null
  }

  return id
}

export function normalizeSupabaseRecipeId(recipeId: number): number {
  const id = parseDbRecipeId(recipeId)

  if (id === null) {
    throw new Error(`Invalid recipe id for saved_recipes: ${recipeId}`)
  }

  return id
}
