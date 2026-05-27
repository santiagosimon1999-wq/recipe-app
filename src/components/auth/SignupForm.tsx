import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/useAuth'
import { mapAuthError } from '../../lib/mapAuthError'
import { AuthAlert } from './AuthAlert'
import { AuthButton } from './AuthButton'
import { AuthField } from './AuthField'

type SignupFormProps = {
  isActive?: boolean
  onSuccess?: () => void
}

export function SignupForm({ isActive = true, onSuccess }: SignupFormProps) {
  const { signup } = useAuth()
  const successTimeoutRef = useRef<number | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isActive) {
      setError('')
      setMessage('')
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
    setMessage('')

    try {
      await signup(email, password)
      setMessage(
        'Account created. Check your email if Supabase requires confirmation.'
      )
      setEmail('')
      setPassword('')

      if (onSuccess) {
        successTimeoutRef.current = window.setTimeout(() => {
          onSuccess()
        }, 3000)
      }
    } catch (err) {
      setError(mapAuthError(err, 'signup'))
    } finally {
      setLoading(false)
    }
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
        minLength={6}
        hint="At least 6 characters"
        disabled={loading}
      />

      {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <AuthButton loading={loading} loadingLabel="Creating account…">
        Create account
      </AuthButton>
    </form>
  )
}
