import { supabase } from '../lib/supabaseClient'
import { RECIPES_WITH_AUTHOR_SELECT, type RecipeRowWithAuthor } from '../lib/recipeService'

export type CollectionSummary = {
  id: string
  name: string
  recipeCount: number
  createdAt: string
  recipeIds: number[]
}

export async function getCollectionsForUser(
  userId: string
): Promise<CollectionSummary[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, created_at, collection_recipes(recipe_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const record = row as {
      id: string
      name: string
      created_at: string
      collection_recipes: { recipe_id: number }[] | null
    }

    const links = record.collection_recipes ?? []
    const recipeIds = links
      .map((link) => Number(link.recipe_id))
      .filter((id) => Number.isFinite(id) && id > 0)

    return {
      id: record.id,
      name: record.name,
      recipeCount: recipeIds.length,
      createdAt: record.created_at,
      recipeIds,
    }
  })
}

export function getCollectionsContainingRecipe(
  collections: CollectionSummary[],
  recipeId: number
): CollectionSummary[] {
  return collections.filter((collection) =>
    collection.recipeIds.includes(recipeId)
  )
}

export async function createCollection(
  userId: string,
  name: string
): Promise<CollectionSummary> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Collection name is required.')
  }

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name: trimmed })
    .select('id, name, created_at')
    .single()

  if (error) throw error

  const record = data as { id: string; name: string; created_at: string }

  return {
    id: record.id,
    name: record.name,
    recipeCount: 0,
    createdAt: record.created_at,
    recipeIds: [],
  }
}

export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<void> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('user_id', userId)
    .eq('id', collectionId)

  if (error) throw error
}

export async function addRecipeToCollection(
  userId: string,
  collectionId: string,
  recipeId: number
): Promise<void> {
  const { error } = await supabase.from('collection_recipes').insert({
    collection_id: collectionId,
    recipe_id: recipeId,
  })

  if (error) {
    const code =
      error && typeof error === 'object'
        ? (error as { code?: string }).code
        : undefined
    if (code === '23505') {
      return
    }
    throw error
  }

  void userId
}

export async function getCollectionRecipeRows(
  userId: string,
  collectionId: string
): Promise<RecipeRowWithAuthor[]> {
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('id', collectionId)
    .maybeSingle()

  if (collectionError) throw collectionError
  if (!collection) return []

  const { data: links, error: linksError } = await supabase
    .from('collection_recipes')
    .select('recipe_id')
    .eq('collection_id', collectionId)

  if (linksError) throw linksError

  const recipeIds = (links ?? [])
    .map((row) => Number((row as { recipe_id: number }).recipe_id))
    .filter((id) => Number.isFinite(id) && id > 0)

  if (recipeIds.length === 0) return []

  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .in('id', recipeIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as unknown as RecipeRowWithAuthor[]
}
