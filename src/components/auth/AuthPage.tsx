import { useState } from 'react'
import { useLocation } from 'react-router'
import TrustFooterLinks from '../TrustFooterLinks'
import { SavoraLogo } from '../brand/SavoraLogo'
import {
  getProtectedRouteAuthReason,
  type AuthNavigationState,
} from '../../lib/authNavigation'
import { AuthTabs, type AuthTabId } from './AuthTabs'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

type AuthPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function getIntentTab(navigationState: AuthNavigationState | null): AuthTabId {
  return navigationState?.authTab === 'signup' ? 'signup' : 'login'
}

export function AuthPage({ theme, onToggleTheme }: AuthPageProps) {
  const location = useLocation()
  const navigationState = location.state as AuthNavigationState | null
  const intentTab = getIntentTab(navigationState)
  const [tabOverride, setTabOverride] = useState<AuthTabId | null>(null)
  const [trackedIntent, setTrackedIntent] = useState(intentTab)

  if (intentTab !== trackedIntent) {
    setTrackedIntent(intentTab)
    setTabOverride(null)
  }

  const activeTab = tabOverride ?? intentTab
  const reasonMessage =
    navigationState?.reason ?? getProtectedRouteAuthReason(location.pathname)

  function handleTabChange(tab: AuthTabId) {
    setTabOverride(tab)
  }

  return (
    <div className={`auth-page app app--${theme}`}>
      <div className="auth-page__inner">
        <button
          type="button"
          className="auth-theme-toggle theme-toggle-button"
          onClick={onToggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div className="auth-page__main">
          <div className="auth-card">
            <header className="auth-brand">
              <SavoraLogo />
              <p className="auth-brand__eyebrow">Welcome</p>
              <h1 className="auth-brand__title">Savora</h1>
              <p className="auth-brand__subtitle">
                Discover, create and share recipes.
              </p>
            </header>

            {reasonMessage ? (
              <p className="auth-page__reason" role="status">
                {reasonMessage}
              </p>
            ) : null}

            <AuthTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              loginPanel={<LoginForm isActive={activeTab === 'login'} />}
              signupPanel={
                <SignupForm
                  isActive={activeTab === 'signup'}
                  onSuccess={() => setTabOverride('login')}
                />
              }
            />
          </div>
        </div>

        <TrustFooterLinks compact className="auth-trust-footer" />
      </div>
    </div>
  )
}
