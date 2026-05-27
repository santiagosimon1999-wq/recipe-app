import type { InputHTMLAttributes } from 'react'

type AuthFieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

export function AuthField({
  id,
  label,
  hint,
  error,
  className,
  ...inputProps
}: AuthFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`auth-field__input${className ? ` ${className}` : ''}`}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
      {hint ? (
        <p className="auth-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="auth-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
