import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  /**
   * Optional fallback renderer. Receives the caught error and a `reset`
   * callback that clears the boundary's error state so the children can
   * re-mount and try again.
   */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /**
   * Optional callback fired on every caught error. Used by Sentry to forward
   * the error to its capture pipeline.
   */
  onError?: (error: Error, info: ErrorInfo) => void
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * App-wide React error boundary. Catches render-time exceptions and renders a
 * recoverable fallback UI instead of a white screen. Forwards every caught
 * error to `props.onError` so Sentry (or any other sink) can pick it up.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info)
    }
    this.props.onError?.(error, info)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state

    if (!error) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback(error, this.handleReset)
    }

    return (
      <section className="error-boundary" role="alert" aria-live="assertive">
        <div className="error-boundary__card">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            An unexpected error happened while rendering this page. Try again,
            or reload the app.
          </p>
          {import.meta.env.DEV ? (
            <pre className="error-boundary__details">{error.message}</pre>
          ) : null}
          <div className="error-boundary__actions">
            <button
              type="button"
              className="error-boundary__retry"
              onClick={this.handleReset}
            >
              Try again
            </button>
            <button
              type="button"
              className="error-boundary__reload"
              onClick={() => window.location.assign('/')}
            >
              Back to home
            </button>
          </div>
        </div>
      </section>
    )
  }
}
