import { useState } from 'react'
import savoraLogo from '../../assets/savora-logo.PNG'
import { AuthTabs, type AuthTabId } from './AuthTabs'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

type AuthPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function AuthPage({ theme, onToggleTheme }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<AuthTabId>('login')

  function handleTabChange(tab: AuthTabId) {
    setActiveTab(tab)
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

        <div className="auth-card">
          <header className="auth-brand">
            <img
              src={savoraLogo}
              alt="Savora logo"
              className="auth-brand__logo"
            />
            <p className="auth-brand__eyebrow">Welcome</p>
            <h1 className="auth-brand__title">Savora</h1>
            <p className="auth-brand__subtitle">
              Discover, create and share recipes.
            </p>
          </header>

          <AuthTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            loginPanel={<LoginForm isActive={activeTab === 'login'} />}
            signupPanel={
              <SignupForm
                isActive={activeTab === 'signup'}
                onSuccess={() => setActiveTab('login')}
              />
            }
          />
        </div>
      </div>
    </div>
  )
}
