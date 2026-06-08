import { DEFAULT_AUTH_PROMPT_MESSAGE } from '../lib/authNavigation'

type AuthPromptCardProps = {
  message?: string
  onLogin: () => void
  onSignUp: () => void
  compact?: boolean
  /** Modal actions use "Continue to …" labels for clarity. */
  variant?: 'inline' | 'modal'
}

export default function AuthPromptCard({
  message = DEFAULT_AUTH_PROMPT_MESSAGE,
  onLogin,
  onSignUp,
  compact = false,
  variant = 'inline',
}: AuthPromptCardProps) {
  const loginLabel = variant === 'modal' ? 'Continue to login' : 'Log in'
  const signUpLabel = variant === 'modal' ? 'Continue to sign up' : 'Sign up'

  return (
    <div className={`auth-prompt-card${compact ? ' auth-prompt-card--compact' : ''}`}>
      <p className="auth-prompt-card__message">{message}</p>
      <div className="auth-prompt-card__actions">
        <button
          type="button"
          className="auth-cta-button auth-cta-button--primary"
          onClick={onSignUp}
          aria-label={signUpLabel}
        >
          {signUpLabel}
        </button>
        <button
          type="button"
          className="auth-cta-button auth-cta-button--secondary"
          onClick={onLogin}
          aria-label={loginLabel}
        >
          {loginLabel}
        </button>
      </div>
    </div>
  )
}
