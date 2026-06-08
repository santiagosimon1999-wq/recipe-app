type AuthButtonProps = {
  loading?: boolean
  loadingLabel: string
  children: string
}

export function AuthButton({ loading = false, loadingLabel, children }: AuthButtonProps) {
  return (
    <button
      type="submit"
      className={`auth-button${loading ? ' auth-button--loading' : ''}`}
      disabled={loading}
      aria-busy={loading}
      aria-label={loading ? loadingLabel : children}
    >
      {loading ? (
        <>
          <span className="auth-button__spinner" aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
