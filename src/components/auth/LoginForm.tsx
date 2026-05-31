import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/useAuth'
import { mapAuthError } from '../../lib/mapAuthError'
import { AuthAlert } from './AuthAlert'
import { AuthButton } from './AuthButton'
import { AuthField } from './AuthField'
import { OAuthButtons } from './OAuthButtons'

type LoginFormProps = {
  isActive?: boolean
}

export function LoginForm({ isActive = true }: LoginFormProps) {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isActive) {
      Promise.resolve().then(() => {
        setError('')
      })
    }
  }, [isActive])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(mapAuthError(err, 'login'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
      <AuthField
        id="login-email"
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
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        disabled={loading}
      />

      <div className="auth-aux-link__row">
        <Link to="/forgot-password" className="auth-aux-link">
          Forgot password?
        </Link>
      </div>

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <AuthButton loading={loading} loadingLabel="Logging in…">
        Log in
      </AuthButton>

      <OAuthButtons disabled={loading} />
    </form>
  )
}
