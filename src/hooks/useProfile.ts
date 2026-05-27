import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { getFallbackUserName } from '../lib/userUtils'
import type { Profile } from '../types/Profile'

type HeaderProfile = Pick<Profile, 'id' | 'display_name' | 'username'>

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<HeaderProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null)
        return
      }

      const fallbackName = getFallbackUserName(user.email)
      const profileData = {
        id: user.id,
        display_name: fallbackName,
        username: fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      }

      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (existingProfile) {
          setProfile(existingProfile as HeaderProfile)
          return
        }

        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })
          .select('id, display_name, username')
          .single()

        if (upsertError) {
          const conflictCode =
            (upsertError as { code?: string }).code ??
            (upsertError as { status?: number }).status

          if (conflictCode === '23505' || conflictCode === 409) {
            const { data: racedProfile, error: racedError } = await supabase
              .from('profiles')
              .select('id, display_name, username')
              .eq('id', user.id)
              .single()

            if (racedError) throw racedError
            setProfile(racedProfile as HeaderProfile)
            return
          }

          throw upsertError
        }

        setProfile(upsertedProfile as HeaderProfile)
      } catch (error) {
        console.error('Failed to load profile:', error)
        setProfile({
          id: user.id,
          display_name: fallbackName,
          username: fallbackName.toLowerCase(),
        })
      }
    }

    void loadProfile()
  }, [user])

  const displayName = useMemo(
    () => profile?.display_name || getFallbackUserName(user?.email),
    [profile, user?.email]
  )

  return { profile, displayName }
}
