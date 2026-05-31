import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/useAuth'
import { mapAuthError } from '../../lib/mapAuthError'
import { AuthAlert } from './AuthAlert'
import { AuthButton } from './AuthButton'
import { AuthField } from './AuthField'
import { OAuthButtons } from './OAuthButtons'

type SignupFormProps = {
  isActive?: boolean
  onSuccess?: () => void
}

type Stage = 'form' | 'check-inbox'

export function SignupForm({ isActive = true, onSuccess }: SignupFormProps) {
  const { signup } = useAuth()
  const successTimeoutRef = useRef<number | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [stage, setStage] = useState<Stage>('form')
  const [pendingEmail, setPendingEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isActive) {
      Promise.resolve().then(() => {
        setError('')
        // When the user switches tabs away from signup mid-success, reset the
        // confirmation screen so the form is fresh next time they return.
        setStage('form')
      })
    }
  }, [isActive])

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current !== null) {
        window.clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signup(email, password)
      const submittedEmail = email
      setEmail('')
      setPassword('')

      if (result.needsEmailConfirmation) {
        setPendingEmail(submittedEmail)
        setStage('check-inbox')
        return
      }

      // Auto-login path — bounce back to the login tab so the AuthGate picks
      // up the new session on the next state tick.
      if (onSuccess) {
        successTimeoutRef.current = window.setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setError(mapAuthError(err, 'signup'))
    } finally {
      setLoading(false)
    }
  }

  if (stage === 'check-inbox') {
    return (
      <div className="auth-form" role="status" aria-live="polite">
        <AuthAlert variant="success">
          We sent a confirmation link to <strong>{pendingEmail}</strong>. Click
          it to verify your email, then come back here to log in.
        </AuthAlert>
        <button
          type="button"
          className="auth-aux-link"
          onClick={() => setStage('form')}
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
      <AuthField
        id="signup-email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        disabled={loading}
      />

      <AuthField
        id="signup-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={8}
        hint="At least 8 characters"
        disabled={loading}
      />

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <AuthButton loading={loading} loadingLabel="Creating account…">
        Create account
      </AuthButton>

      <OAuthButtons disabled={loading} />
    </form>
  )
}
