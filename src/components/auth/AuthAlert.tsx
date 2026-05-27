import type { ReactNode } from 'react'

type AuthAlertProps = {
  variant: 'error' | 'success'
  children: ReactNode
}

export function AuthAlert({ variant, children }: AuthAlertProps) {
  return (
    <div
      className={`auth-alert auth-alert--${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  )
}
