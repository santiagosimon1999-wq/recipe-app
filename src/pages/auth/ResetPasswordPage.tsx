import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import savoraLogo from '../../assets/savora-logo.PNG'
import { supabase } from '../../lib/supabaseClient'
import { mapAuthError } from '../../lib/mapAuthError'
import { AuthAlert } from '../../components/auth/AuthAlert'
import { AuthButton } from '../../components/auth/AuthButton'
import { AuthField } from '../../components/auth/AuthField'

type Stage = 'verifying' | 'invalid' | 'ready' | 'success'

/**
 * Landing page for the password recovery email link.
 *
 * Supabase routes the user here with a session attached via the recovery
 * code in the URL. We verify a session is present, then let them set a new
 * password via `auth.updateUser({ password })`.
 *
 * If no session exists (link expired or opened twice), we show an "invalid
 * link" state with a path back to /forgot-password.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('verifying')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      // Supabase auto-detects the recovery code in the URL when the SDK
      // initializes; by the time React mounts there should be a session.
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      setStage(session ? 'ready' : 'invalid')
    }

    void checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      setStage('success')
      setPassword('')
      setConfirmPassword('')

      // Sign the user out so they re-enter with the new password.
      // (Without this they'd be silently logged in from the recovery session.)
      await supabase.auth.signOut()

      window.setTimeout(() => {
        navigate('/', { replace: true })
      }, 2500)
    } catch (err) {
      setError(mapAuthError(err, 'login'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page app app--light">
      <div className="auth-page__inner">
        <div className="auth-card">
          <header className="auth-brand">
            <img
              src={savoraLogo}
              alt="Savora logo"
              className="auth-brand__logo"
            />
            <p className="auth-brand__eyebrow">Choose a new password</p>
            <h1 className="auth-brand__title">Reset password</h1>
            <p className="auth-brand__subtitle">
              At least 8 characters. Mix letters, numbers, and symbols.
            </p>
          </header>

          {stage === 'verifying' ? (
            <div
              className="auth-loading"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="auth-loading__spinner" aria-hidden="true" />
              <p className="auth-loading__text">Verifying link…</p>
            </div>
          ) : null}

          {stage === 'invalid' ? (
            <>
              <AuthAlert variant="error">
                This password reset link is invalid or has expired. Request a
                new one.
              </AuthAlert>
              <div className="auth-aux-link__row">
                <button
                  type="button"
                  className="auth-aux-link"
                  onClick={() => navigate('/forgot-password')}
                >
                  Request a new link
                </button>
              </div>
            </>
          ) : null}

          {stage === 'success' ? (
            <AuthAlert variant="success">
              Password updated. Redirecting you to login…
            </AuthAlert>
          ) : null}

          {stage === 'ready' ? (
            <form
              className="auth-form"
              onSubmit={handleSubmit}
              aria-busy={loading}
            >
              <AuthField
                id="reset-password"
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                hint="At least 8 characters"
                disabled={loading}
              />

              <AuthField
                id="reset-password-confirm"
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                disabled={loading}
              />

              {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

              <AuthButton loading={loading} loadingLabel="Updating…">
                Update password
              </AuthButton>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
