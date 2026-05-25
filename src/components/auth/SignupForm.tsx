import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/useAuth'

export function SignupForm() {
  const { signup } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await signup(email, password)
      setMessage('Cuenta creada. Revisa tu correo si Supabase pide confirmación.')
      setEmail('')
      setPassword('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo crear la cuenta'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign up</h2>

      <div>
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}
    </form>
  )
}