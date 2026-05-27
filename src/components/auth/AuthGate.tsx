import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { AuthPage } from './AuthPage'
import { useAuth } from '../../context/useAuth'

type AuthGateProps = {
  children: ReactNode
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

/**
 * Routes that must remain reachable while signed out so users can complete
 * password recovery flows even before/after a session exists.
 */
const PUBLIC_AUTH_ROUTES = ['/forgot-password', '/reset-password']

function isPublicAuthRoute(pathname: string): boolean {
  return PUBLIC_AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function AuthGate({ children, theme, onToggleTheme }: AuthGateProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className={`auth-page app app--${theme}`}>
        <div className="auth-page__inner">
          <div className="auth-loading" role="status" aria-live="polite" aria-busy="true">
            <span className="auth-loading__spinner" aria-hidden="true" />
            <p className="auth-loading__text">Loading your session…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user && !isPublicAuthRoute(location.pathname)) {
    return <AuthPage theme={theme} onToggleTheme={onToggleTheme} />
  }

  return <>{children}</>
}
