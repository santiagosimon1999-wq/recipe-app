import { getSupabaseRecipeId } from './favorites'
import type { Recipe } from '../types/Recipe'

export function getRecipeSharePath(recipeId: number): string {
  return `/recipes/${recipeId}`
}

export function getRecipeShareUrl(recipeId: number): string {
  if (typeof window === 'undefined') {
    return getRecipeSharePath(recipeId)
  }

  return `${window.location.origin}${getRecipeSharePath(recipeId)}`
}

export function recipeSupportsSharing(recipe: Recipe): boolean {
  if (recipe.source === 'sample') return false
  if (recipe.source === 'user' && !recipe.isPublic) return false
  return getSupabaseRecipeId(recipe) !== null
}
