import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { SavoraLogo } from '../../components/brand/SavoraLogo'
import { supabase } from '../../lib/supabaseClient'
import { mapAuthError } from '../../lib/mapAuthError'
import { AuthAlert } from '../../components/auth/AuthAlert'
import { AuthButton } from '../../components/auth/AuthButton'
import { AuthField } from '../../components/auth/AuthField'

/**
 * Public page (reachable while signed-out) where a user requests a password
 * recovery email. Supabase mails them a link to /reset-password?code=… which
 * is handled by ResetPasswordPage.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      )

      if (requestError) throw requestError

      // Intentionally generic to avoid leaking which emails are registered.
      setMessage(
        "If an account exists for that email, we've sent a password reset link. Check your inbox."
      )
      setEmail('')
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
            <SavoraLogo />
            <p className="auth-brand__eyebrow">Reset your password</p>
            <h1 className="auth-brand__title">Forgot password</h1>
            <p className="auth-brand__subtitle">
              Enter the email tied to your Savora account.
            </p>
          </header>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            aria-busy={loading}
          >
            <AuthField
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
            />

            {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}
            {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

            <AuthButton loading={loading} loadingLabel="Sending…">
              Send reset link
            </AuthButton>
          </form>

          <div className="auth-aux-link__row">
            <Link to="/" className="auth-aux-link">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
