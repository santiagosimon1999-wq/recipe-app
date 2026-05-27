import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import {
  AuthContext,
  type AuthContextValue,
  type OAuthProvider,
} from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function bootstrapAuth() {
      const {
        data: { user: validatedUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error('Failed to validate session:', userError.message)
        await supabase.auth.signOut()
      }

      if (!isMounted) {
        return
      }

      if (userError || !validatedUser) {
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Failed to get session:', sessionError.message)
      }

      setUser(validatedUser)
      setSession(session)
      setLoading(false)
    }

    void bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signup: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Supabase returns `data.session = null` when email confirmation is
        // required by the project settings; non-null when auto-login is on.
        return { needsEmailConfirmation: data.session === null }
      },
      login: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signInWithOAuth: async (provider: OAuthProvider) => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        })
        if (error) throw error
      },
      logout: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
    }),
    [user, session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}