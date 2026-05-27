import type { ReactNode } from 'react'
import { AuthPage } from './AuthPage'
import { useAuth } from '../../context/useAuth'

type AuthGateProps = {
  children: ReactNode
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function AuthGate({ children, theme, onToggleTheme }: AuthGateProps) {
  const { user, loading } = useAuth()

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

  if (!user) {
    return <AuthPage theme={theme} onToggleTheme={onToggleTheme} />
  }

  return <>{children}</>
}
