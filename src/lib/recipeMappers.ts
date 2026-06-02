import type { Recipe } from '../types/Recipe'
import { parseDbRecipeId } from '../utils/favorites'
import {
  getPrimaryCategory,
  resolveLegacyCategoryNames,
  toCategoryTag,
} from '../utils/categories'
import type { RecipeRowWithAuthor } from './recipeService'

/**
 * Single source of truth for transforming a database `recipes` row (optionally
 * including the joined `author.{username, display_name}`) into the UI `Recipe`.
 *
 * The joined `author` field may come back from PostgREST as either a single
 * object or an array (depending on the FK shape), so we normalize both cases
 * here in one place.
 */
function getAuthorRecord(row: RecipeRowWithAuthor) {
  const author = row.author
  if (!author) return null
  return Array.isArray(author) ? (author[0] ?? null) : author
}

export function extractAuthorUsername(
  row: RecipeRowWithAuthor
): string | undefined {
  return getAuthorRecord(row)?.username ?? undefined
}

export function extractAuthorDisplayName(
  row: RecipeRowWithAuthor
): string | undefined {
  return getAuthorRecord(row)?.display_name ?? undefined
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

  const mappedCategoryTags = (row.category_tags ?? []).map((tag) => ({
    ...tag,
    icon: tag.icon ?? null,
  }))
  const mappedCategoryNames =
    mappedCategoryTags.length > 0
      ? mappedCategoryTags.map((tag) => tag.name)
      : resolveLegacyCategoryNames(row.category)
  const primaryCategory = getPrimaryCategory(mappedCategoryNames)

  return {
    id: dbId ?? 0,
    title: row.title,
    image: row.image_url ?? '',
    imageFile: null,
    description: row.description ?? '',
    category: primaryCategory,
    categories: mappedCategoryNames,
    categoryTags:
      mappedCategoryTags.length > 0
        ? mappedCategoryTags
        : mappedCategoryNames
            .map((name) => toCategoryTag(name))
            .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    carbs: row.carbs ?? 0,
    fat: row.fat ?? 0,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? '',
    source: belongsToCurrentUser ? 'user' : 'community',
    userId: row.user_id,
    // Display name precedence: joined profile.display_name → joined username →
    // final literal fallback. The legacy `recipes.author_name` denormalized
    // column was dropped in Phase 4.1 (db/migrations/006_phase4_hardening.sql).
    authorName:
      extractAuthorDisplayName(row) ??
      extractAuthorUsername(row) ??
      'Savora Chef',
    authorUsername: extractAuthorUsername(row),
    isPublic: row.is_public ?? true,
    likeCount: 0,
    liked: false,
  }
}

/** Ensure in-memory recipe objects are safe to render in RecipeModal/RecipeCard. */
export function normalizeRecipeForUi(recipe: Recipe): Recipe {
  const id = parseDbRecipeId(recipe.id) ?? recipe.id

  return {
    ...recipe,
    id,
    description: recipe.description ?? '',
    category: recipe.category ?? getPrimaryCategory(recipe.categories ?? []),
    categories:
      recipe.categories && recipe.categories.length > 0
        ? recipe.categories
        : resolveLegacyCategoryNames(recipe.category),
    categoryTags:
      recipe.categoryTags && recipe.categoryTags.length > 0
        ? recipe.categoryTags
        : resolveLegacyCategoryNames(recipe.category)
            .map((name) => toCategoryTag(name))
            .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
    calories: recipe.calories ?? 0,
    protein: recipe.protein ?? 0,
    carbs: recipe.carbs ?? 0,
    fat: recipe.fat ?? 0,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: recipe.instructions ?? '',
    likeCount: recipe.likeCount ?? 0,
    liked: recipe.liked ?? false,
  }
}
