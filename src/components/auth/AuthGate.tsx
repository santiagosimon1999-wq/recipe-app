import type { ReactNode } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { useAuth } from '../../context/useAuth'

type AuthGateProps = {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <>
      {!user ? (
        <div>
          <LoginForm />
          <hr />
          <SignupForm />
          <hr />
        </div>
      ) : null}

      {children}
    </>
  )
}