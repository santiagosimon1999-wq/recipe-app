import type { Recipe } from '../types/Recipe'

/** True when a recipe is backed by Supabase and can receive comments. */
export function recipeSupportsComments(recipe: Recipe): boolean {
  if (recipe.source === 'sample') {
    return false
  }

  if (recipe.source === 'user' || recipe.source === 'community') {
    return true
  }

  // Defensive: DB-backed recipes should always carry a source, but treat any
  // non-sample row with a positive id as commentable if source was omitted.
  return recipe.id > 0
}
