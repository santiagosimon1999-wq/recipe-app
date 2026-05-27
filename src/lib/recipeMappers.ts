import type { Recipe } from '../types/Recipe'
import { parseDbRecipeId } from '../utils/favorites'
import type { RecipeRowWithAuthor } from './recipeService'

/**
 * Single source of truth for transforming a database `recipes` row (optionally
 * including the joined `author.username`) into the UI `Recipe` shape.
 *
 * The joined `author` field may come back from PostgREST as either a single
 * object or an array (depending on the FK shape), so we normalize both cases
 * here in one place.
 */
export function extractAuthorUsername(
  row: RecipeRowWithAuthor
): string | undefined {
  const author = row.author
  if (!author) return undefined
  if (Array.isArray(author)) {
    return author[0]?.username ?? undefined
  }
  return author.username ?? undefined
}

/**
 * Map a Supabase recipes row (with optional joined author) into the UI Recipe.
 *
 * `currentUserId` lets the mapper classify the row as belonging to the current
 * user (`source: 'user'`) versus the community (`source: 'community'`).
 *
 * `likeCount` and `liked` are intentionally left at zero/false here — they get
 * enriched after the row is mapped (App.tsx fetches likes/likes-by-user
 * separately and merges them into the recipe list).
 */
export function mapDbRowToRecipe(
  row: RecipeRowWithAuthor,
  currentUserId?: string
): Recipe {
  const dbId = parseDbRecipeId(row.id)

  if (dbId === null) {
    console.error('mapDbRowToRecipe: missing or invalid Supabase id', row)
  }

  const belongsToCurrentUser = Boolean(
    currentUserId && row.user_id === currentUserId
  )

  return {
    id: dbId ?? 0,
    title: row.title,
    image: row.image_url ?? '',
    imageFile: null,
    description: row.description,
    category: row.category,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    ingredients: row.ingredients,
    instructions: row.instructions,
    source: belongsToCurrentUser ? 'user' : 'community',
    userId: row.user_id,
    authorName: row.author_name ?? 'Savora Chef',
    authorUsername: extractAuthorUsername(row),
    isPublic: row.is_public ?? true,
    likeCount: 0,
    liked: false,
  }
}
