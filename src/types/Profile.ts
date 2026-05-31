import type { Database } from './database'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/** UI/domain profile shape (matches public.profiles row). */
export type Profile = ProfileRow

/** Fields shown on public profile pages — no private data. */
export type PublicProfile = Pick<
  Profile,
  'id' | 'display_name' | 'username' | 'avatar_url' | 'bio' | 'created_at'
>

/** Payload for editing the signed-in user's profile. */
export type ProfileEditInput = {
  display_name?: string | null
  username?: string | null
  bio?: string | null
  avatar_url?: string | null
}
