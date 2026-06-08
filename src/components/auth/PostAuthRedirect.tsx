import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../context/useAuth'
import {
  buildAuthReturnPath,
  resolveSafeRedirectPath,
  type AuthNavigationState,
} from '../../lib/authNavigation'

/**
 * After a successful login/sign-up, send the user back to their intended
 * in-app destination when auth navigation state includes a safe `from` path.
 */
export default function PostAuthRedirect() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (!user || hasRedirectedRef.current) return

    const state = location.state as AuthNavigationState | null
    const target = resolveSafeRedirectPath(state?.from)
    if (!target) return

    const currentPath = buildAuthReturnPath(
      location.pathname,
      location.search,
      location.hash,
    )

    if (target === currentPath) return

    hasRedirectedRef.current = true
    navigate(target, { replace: true, state: null })
  }, [user, location.pathname, location.search, location.hash, location.state, navigate])

  return null
}
