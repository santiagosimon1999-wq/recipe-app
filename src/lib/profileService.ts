import { supabase } from './supabaseClient'
import type { Profile, PublicProfile } from '../types/Profile'
import {
  RECIPES_WITH_AUTHOR_SELECT,
  type RecipeRowWithAuthor,
} from './recipeService'

export function logSupabaseError(context: string, error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }
    console.error(`Supabase error [${context}]:`, {
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code,
    })
    return
  }
  console.error(`Supabase error [${context}]:`, error)
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, bio')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    logSupabaseError('getProfileById', error)
    throw error
  }

  return (data as Profile | null) ?? null
}

export async function getProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  const trimmed = username?.trim()
  if (!trimmed) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, bio, created_at')
    .ilike('username', trimmed)
    .maybeSingle()

  if (error) {
    logSupabaseError('getProfileByUsername', error)
    throw error
  }

  return (data as PublicProfile | null) ?? null
}

export async function getPublicRecipesByUserId(
  userId: string
): Promise<RecipeRowWithAuthor[]> {
  if (!userId) return []

  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPES_WITH_AUTHOR_SELECT)
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('getPublicRecipesByUserId', error)
    throw error
  }

  return (data ?? []) as RecipeRowWithAuthor[]
}

export async function getRecipeCountByUserId(userId: string): Promise<number> {
  if (!userId) return 0

  const { count, error } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    logSupabaseError('getRecipeCountByUserId', error)
    throw error
  }

  return count ?? 0
}
