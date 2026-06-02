import { supabase } from './supabaseClient'
import type { Database } from '../types/database'
import type { CategoryGroupKey, CategoryTag } from '../types/Category'
import { getCategoryOption, resolveLegacyCategoryNames } from '../utils/categories'
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
  category_tags?: CategoryTag[]
}

export type CategoryRegistryItem = {
  id: number
  name: string
  slug: string
  icon: string | null
  groupKey: CategoryGroupKey
  groupLabel: string
}

export const RECIPES_WITH_AUTHOR_SELECT =
  '*, author:profiles!recipes_author_id_fkey(username, display_name)'

export type RecipeCreateInput = {
  title: string
  description?: string
  ingredients?: string[]
  instructions?: string
  category?: string
  categories?: string[]
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
  /** Filter by category assignment. */
  category?: string
  /** Only recipes from these user ids (e.g. people you follow). */
  authorUserIds?: string[]
}

export type PublicRecipeSearchSort = 'newest' | 'oldest'

export type SearchPublicRecipesOptions = {
  limit?: number
  excludeUserId?: string
  category?: string
  maxCalories?: number
  minProtein?: number
  sortBy?: PublicRecipeSearchSort
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

function sanitizeSearchTerm(input: string): string {
  const withoutControls = Array.from(input)
    .map((char) => {
      const code = char.charCodeAt(0)
      return code < 32 || code === 127 ? ' ' : char
    })
    .join('')

  return withoutControls.replace(/\s+/g, ' ').trim()
}

function escapeForPostgrestIlike(rawValue: string): string {
  return rawValue
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[(),]/g, ' ')
    .replace(/[%_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCategoryPayload(input: {
  category?: string
  categories?: string[]
}): string[] {
  const candidates = [
    ...(input.categories ?? []),
    ...(input.category ? [input.category] : []),
  ]

  const normalized = new Set<string>()

  for (const candidate of candidates) {
    const trimmed = candidate.trim()
    if (!trimmed) continue
    const option = getCategoryOption(trimmed)
    if (option) {
      normalized.add(option.name)
      continue
    }

    for (const mapped of resolveLegacyCategoryNames(trimmed)) {
      normalized.add(mapped)
    }
  }

  return [...normalized]
}

function toCategoryTagFromRegistryRow(row: {
  id: number
  name: string
  slug: string
  icon: string | null
  category_groups?: { key: string; label: string } | { key: string; label: string }[] | null
}): CategoryTag | null {
  const groupRaw = Array.isArray(row.category_groups)
    ? row.category_groups[0]
    : row.category_groups

  if (!groupRaw?.key || !groupRaw.label) {
    return null
  }

  const groupKey = groupRaw.key as CategoryGroupKey

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    groupKey,
    groupLabel: groupRaw.label,
  }
}

async function getRecipeCategoryTagsByRecipeIds(
  recipeIds: number[]
): Promise<Record<number, CategoryTag[]>> {
  if (recipeIds.length === 0) return {}

  const { data, error } = await supabase
    .from('recipe_categories')
    .select(
      `
      recipe_id,
      categories (
        id,
        name,
        slug,
        icon,
        category_groups (
          key,
          label
        )
      )
    `
    )
    .in('recipe_id', recipeIds)

  if (error) {
    throw error
  }

  const result: Record<number, CategoryTag[]> = {}
  for (const recipeId of recipeIds) {
    result[recipeId] = []
  }

  for (const row of (data ?? []) as Array<{
    recipe_id: number
    categories?: {
      id: number
      name: string
      slug: string
      icon: string | null
      category_groups?: { key: string; label: string } | { key: string; label: string }[] | null
    } | null
  }>) {
    if (!row.categories) continue
    const tag = toCategoryTagFromRegistryRow(row.categories)
    if (!tag) continue
    if (!result[row.recipe_id]) result[row.recipe_id] = []
    result[row.recipe_id].push(tag)
  }

  return result
}

async function attachCategoryTags(
  rows: RecipeRowWithAuthor[]
): Promise<RecipeRowWithAuthor[]> {
  const recipeIds = rows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id) && id > 0)

  if (recipeIds.length === 0) return rows

  try {
    const tagsByRecipe = await getRecipeCategoryTagsByRecipeIds(recipeIds)
    return rows.map((row) => ({
      ...row,
      category_tags: tagsByRecipe[Number(row.id)] ?? [],
    }))
  } catch (error) {
    console.error('Failed to hydrate recipe category tags:', error)
    return rows
  }
}

async function getRecipeIdsForCategory(categoryName: string): Promise<number[]> {
  const selected = normalizeCategoryPayload({ category: categoryName })
  if (selected.length === 0) return []

  const { data, error } = await supabase
    .from('recipe_categories')
    .select('recipe_id, categories!inner(name)')
    .in('categories.name', selected)

  if (error) {
    throw error
  }

  return [...new Set((data ?? []).map((row) => Number((row as { recipe_id: number }).recipe_id)).filter((id) => Number.isFinite(id) && id > 0))]
}

async function syncRecipeCategories(
  recipeId: number,
  categoryNames: string[]
): Promise<void> {
  const normalized = normalizeCategoryPayload({ categories: categoryNames })

  await supabase
    .from('recipe_categories')
    .delete()
    .eq('recipe_id', recipeId)

  if (normalized.length === 0) {
    return
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .in('name', normalized)
    .eq('is_active', true)

  if (categoriesError) {
    throw categoriesError
  }

  const inserts = (categories ?? []).map((item) => ({
    recipe_id: recipeId,
    category_id: Number((item as { id: number }).id),
  }))

  if (inserts.length === 0) {
    return
  }

  const { error: insertError } = await supabase
    .from('recipe_categories')
    .insert(inserts)

  if (insertError) {
    throw insertError
  }
}

export async function getCategoryRegistry(): Promise<CategoryRegistryItem[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(
      `
      id,
      name,
      slug,
      icon,
      sort_order,
      category_groups!inner (
        key,
        label
      )
    `
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return ((data ?? []) as Array<{
    id: number
    name: string
    slug: string
    icon: string | null
    category_groups?: { key: string; label: string } | { key: string; label: string }[] | null
  }>)
    .map((row) => {
      const group = Array.isArray(row.category_groups)
        ? row.category_groups[0]
        : row.category_groups
      if (!group?.key || !group.label) return null
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        icon: row.icon,
        groupKey: group.key as CategoryGroupKey,
        groupLabel: group.label,
      }
    })
    .filter((row): row is CategoryRegistryItem => row !== null)
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

  return attachCategoryTags((data ?? []) as unknown as RecipeRowWithAuthor[])
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

  if (options?.category) {
    const categoryRecipeIds = await getRecipeIdsForCategory(options.category)
    if (categoryRecipeIds.length === 0) {
      return []
    }
    query = query.in('id', categoryRecipeIds)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return attachCategoryTags((data ?? []) as unknown as RecipeRowWithAuthor[])
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

  const [enriched] = await attachCategoryTags([row])
  return enriched ?? row
}

export async function searchPublicRecipes(
  searchTerm: string,
  options?: SearchPublicRecipesOptions
): Promise<RecipeRowWithAuthor[]> {
  const sanitizedInput = sanitizeSearchTerm(searchTerm)
  if (!sanitizedInput) return []

  const limit = options?.limit ?? 40
  const escaped = escapeForPostgrestIlike(sanitizedInput)
  if (!escaped) return []
  const pattern = `"%${escaped}%"`

  const ascending = options?.sortBy === 'oldest'
  const categoryRecipeIds =
    options?.category && options.category !== 'All'
      ? await getRecipeIdsForCategory(options.category)
      : null

  if (categoryRecipeIds && categoryRecipeIds.length === 0) {
    return []
  }

  let textQuery = supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('is_public', true)
    .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)

  if (options?.excludeUserId) {
    textQuery = textQuery.neq('user_id', options.excludeUserId)
  }

  if (categoryRecipeIds) {
    textQuery = textQuery.in('id', categoryRecipeIds)
  }

  if (typeof options?.maxCalories === 'number') {
    textQuery = textQuery.lte('calories', options.maxCalories)
  }

  if (typeof options?.minProtein === 'number') {
    textQuery = textQuery.gte('protein', options.minProtein)
  }

  const { data: textMatches, error: textError } = await textQuery
    .order('created_at', { ascending })
    .limit(limit)

  if (textError) throw textError

  /**
   * Ingredient fuzzy search fallback:
   * PostgREST does not provide a safe, portable partial match operator for text[]
   * elements, so we fetch a bounded public candidate pool and filter ingredients
   * in memory. This keeps scope small and avoids DB/schema changes.
   */
  let ingredientMatches: RecipeRowWithAuthor[] = []
  const ingredientPoolLimit = Math.max(limit, 120)

  let ingredientPoolQuery = supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('is_public', true)

  if (options?.excludeUserId) {
    ingredientPoolQuery = ingredientPoolQuery.neq('user_id', options.excludeUserId)
  }

  if (categoryRecipeIds) {
    ingredientPoolQuery = ingredientPoolQuery.in('id', categoryRecipeIds)
  }

  if (typeof options?.maxCalories === 'number') {
    ingredientPoolQuery = ingredientPoolQuery.lte('calories', options.maxCalories)
  }

  if (typeof options?.minProtein === 'number') {
    ingredientPoolQuery = ingredientPoolQuery.gte('protein', options.minProtein)
  }

  const { data: ingredientPool, error: ingredientPoolError } = await ingredientPoolQuery
    .order('created_at', { ascending })
    .limit(ingredientPoolLimit)

  if (!ingredientPoolError) {
    const term = sanitizedInput.toLowerCase()
    ingredientMatches = ((ingredientPool ?? []) as unknown as RecipeRowWithAuthor[])
      .filter((row) =>
        (row.ingredients ?? []).some((ingredient) =>
          ingredient.toLowerCase().includes(term)
        )
      )
      .slice(0, limit)
  }

  const mergedById = new Map<number, RecipeRowWithAuthor>()
  for (const row of (textMatches ?? []) as unknown as RecipeRowWithAuthor[]) {
    mergedById.set(row.id, row)
  }
  for (const row of ingredientMatches) {
    if (!mergedById.has(row.id)) {
      mergedById.set(row.id, row)
    }
  }

  const mergedRows = Array.from(mergedById.values())
  const enrichedRows = await attachCategoryTags(mergedRows)

  return enrichedRows
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return ascending ? aTime - bTime : bTime - aTime
    })
    .slice(0, limit)
}

export async function createRecipe(
  userId: string,
  recipe: RecipeCreateInput
): Promise<RecipeRowWithAuthor> {
  if (!userId) {
    throw new Error('createRecipe requires an authenticated user id')
  }

  const normalizedCategoryNames = normalizeCategoryPayload({
    category: recipe.category,
    categories: recipe.categories,
  })
  const primaryCategory = normalizedCategoryNames[0] ?? recipe.category ?? 'Other'

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      author_id: userId,
      title: recipe.title,
      description: recipe.description ?? '',
      ingredients: recipe.ingredients ?? [],
      instructions: recipe.instructions ?? '',
      category: primaryCategory,
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

  const created = data as unknown as RecipeRowWithAuthor
  if (normalizedCategoryNames.length > 0) {
    await syncRecipeCategories(created.id, normalizedCategoryNames)
  }

  const [enriched] = await attachCategoryTags([created])
  return enriched ?? created
}

export async function updateRecipe(
  recipeId: number,
  userId: string,
  updates: RecipeUpdateInput
): Promise<RecipeRowWithAuthor> {
  if (!userId) {
    throw new Error('updateRecipe requires an authenticated user id')
  }

  const normalizedCategoryNames = normalizeCategoryPayload({
    category: updates.category,
    categories: updates.categories,
  })
  const nextPrimaryCategory =
    normalizedCategoryNames[0] ??
    updates.category

  const payload: Database['public']['Tables']['recipes']['Update'] = {
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
    ...(nextPrimaryCategory !== undefined ? { category: nextPrimaryCategory } : {}),
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

  const updated = data as unknown as RecipeRowWithAuthor
  if (updates.category !== undefined || updates.categories !== undefined) {
    await syncRecipeCategories(updated.id, normalizedCategoryNames)
  }

  const [enriched] = await attachCategoryTags([updated])
  return enriched ?? updated
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

export async function getSavedRecipesForUser(
  userId: string
): Promise<RecipeRowWithAuthor[]> {
  if (!userId) {
    throw new Error('getSavedRecipesForUser requires an authenticated user id')
  }

  const { data, error } = await supabase
    .from('saved_recipes')
    .select(
      `
      created_at,
      recipe:recipes (
        ${RECIPES_WITH_AUTHOR_SELECT}
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase getSavedRecipesForUser error:', error)
    throw error
  }

  const recipeRows = (data ?? [])
    .map(
      (row) =>
        (row as {
          recipe: RecipeRowWithAuthor | RecipeRowWithAuthor[] | null
        }).recipe
    )
    .flatMap((recipe) => {
      if (!recipe) return []
      return Array.isArray(recipe) ? recipe : [recipe]
    })
    .filter(
      (recipe): recipe is RecipeRowWithAuthor =>
        Number.isFinite(Number(recipe.id)) && Number(recipe.id) > 0
    )

  if (recipeRows.length === 0) {
    return []
  }

  return attachCategoryTags(recipeRows)
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