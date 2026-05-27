import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { mapAuthError } from '../../lib/mapAuthError'
import { AuthAlert } from './AuthAlert'

type OAuthButtonsProps = {
  disabled?: boolean
}

export function OAuthButtons({ disabled = false }: OAuthButtonsProps) {
  const { signInWithOAuth } = useAuth()
  const [loadingProvider, setLoadingProvider] = useState<
    'google' | 'github' | null
  >(null)
  const [error, setError] = useState('')

  async function handleOAuth(provider: 'google' | 'github') {
    if (disabled || loadingProvider) return

    setLoadingProvider(provider)
    setError('')

    try {
      await signInWithOAuth(provider)
    } catch (err) {
      setError(mapAuthError(err, 'login'))
      setLoadingProvider(null)
    }
  }

  return (
    <div className="auth-oauth">
      <p className="auth-oauth__divider">
        <span>or continue with</span>
      </p>

      <div className="auth-oauth__buttons">
        <button
          type="button"
          className="auth-oauth__button"
          onClick={() => void handleOAuth('google')}
          disabled={disabled || loadingProvider !== null}
          aria-busy={loadingProvider === 'google'}
        >
          {loadingProvider === 'google' ? 'Connecting…' : 'Google'}
        </button>
        <button
          type="button"
          className="auth-oauth__button"
          onClick={() => void handleOAuth('github')}
          disabled={disabled || loadingProvider !== null}
          aria-busy={loadingProvider === 'github'}
        >
          {loadingProvider === 'github' ? 'Connecting…' : 'GitHub'}
        </button>
      </div>

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
    </div>
  )
}
