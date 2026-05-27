import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type SignupResult = {
  /**
   * True when Supabase requires the user to verify their email before they
   * can sign in (no session is returned from signUp). False when the project
   * has email confirmation disabled and the user is logged in immediately.
   */
  needsEmailConfirmation: boolean
}

export type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signup: (email: string, password: string) => Promise<SignupResult>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)