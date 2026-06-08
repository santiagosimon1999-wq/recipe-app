import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  AUTH_ENTRY_ROUTE,
  buildAuthReturnPath,
  resolveSafeRedirectPath,
  type AuthIntent,
  type AuthNavigationState,
} from '../lib/authNavigation'

export function useAuthNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const goToAuth = useCallback(
    (intent: AuthIntent, reason?: string, returnTo?: string) => {
      const fallbackReturn = buildAuthReturnPath(
        location.pathname,
        location.search,
        location.hash,
      )
      const safeReturn =
        resolveSafeRedirectPath(returnTo) ??
        resolveSafeRedirectPath(fallbackReturn) ??
        '/'

      const state: AuthNavigationState = {
        authTab: intent,
        from: safeReturn,
        reason,
      }
      void navigate(AUTH_ENTRY_ROUTE, { state })
    },
    [navigate, location.pathname, location.search, location.hash],
  )

  const goToLogin = useCallback(
    (reason?: string, returnTo?: string) => {
      goToAuth('login', reason, returnTo)
    },
    [goToAuth],
  )

  const goToSignUp = useCallback(
    (reason?: string, returnTo?: string) => {
      goToAuth('signup', reason, returnTo)
    },
    [goToAuth],
  )

  const goToProtectedRoute = useCallback(
    (route: string, intent: AuthIntent, reason?: string) => {
      const safeRoute = resolveSafeRedirectPath(route)
      if (!safeRoute) return
      goToAuth(intent, reason, safeRoute)
    },
    [goToAuth],
  )

  return { goToAuth, goToLogin, goToSignUp, goToProtectedRoute }
}
