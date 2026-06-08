import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuthNavigation } from './useAuthNavigation'
import { getProtectedRouteAuthReason } from '../lib/authNavigation'
import type { MoreMenuRouteItem } from '../lib/moreMenu'

export function useMoreMenuActions(onClose?: () => void) {
  const navigate = useNavigate()
  const { goToLogin, goToSignUp, goToProtectedRoute } = useAuthNavigation()

  const handleRouteItem = useCallback(
    (item: MoreMenuRouteItem, isLoggedIn: boolean) => {
      onClose?.()

      if (item.requiresAuth && !isLoggedIn) {
        const reason =
          getProtectedRouteAuthReason(item.route) ??
          'Create an account to unlock this feature.'
        goToProtectedRoute(item.route, item.authIntent ?? 'login', reason)
        return
      }

      void navigate(item.route)
    },
    [goToProtectedRoute, navigate, onClose],
  )

  const handleLogin = useCallback(() => {
    onClose?.()
    goToLogin()
  }, [goToLogin, onClose])

  const handleSignUp = useCallback(() => {
    onClose?.()
    goToSignUp()
  }, [goToSignUp, onClose])

  return { handleRouteItem, handleLogin, handleSignUp }
}
