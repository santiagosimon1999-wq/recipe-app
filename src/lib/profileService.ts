import { supabase } from './supabaseClient'
import type { Profile, PublicProfile } from '../types/Profile'

export type PublicRecipeRow = {
  id: number
  user_id: string
  title: string
  image_url: string | null
  description: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string
  author_name: string | null
  is_public: boolean
  created_at?: string | null
}

function logSupabaseError(context: string, error: unknown) {
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
    .select('id, display_name, username, avatar_url, bio')
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
): Promise<PublicRecipeRow[]> {
  if (!userId) return []

  const { data, error } = await supabase
    .from('recipes')
    .select(
      'id, user_id, title, image_url, description, category, calories, protein, carbs, fat, ingredients, instructions, author_name, is_public'
    )
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('id', { ascending: false })

  if (error) {
    logSupabaseError('getPublicRecipesByUserId', error)
    throw error
  }

  return (data ?? []) as PublicRecipeRow[]
}
