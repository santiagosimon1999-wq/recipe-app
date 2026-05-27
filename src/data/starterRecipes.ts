import { recipes as initialRecipes } from './recipes'
import type { Recipe } from '../types/Recipe'

/** Static sample recipes bundled with the app (local-only favorites/likes). */
export const starterRecipes: Recipe[] = initialRecipes.map((recipe) => ({
  ...recipe,
  source: 'sample' as const,
  isPublic: true,
  authorName: 'Savora Chef',
  likeCount: 0,
  liked: false,
}))
