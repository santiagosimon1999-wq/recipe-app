import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry browser SDK if a DSN is configured.
 *
 * Reads `VITE_SENTRY_DSN` from the build-time env. If the DSN is absent
 * (local dev, preview deploys without secrets), Sentry is a no-op — no events
 * are captured, no network requests are made.
 *
 * Call this once from main.tsx before React renders.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip query strings from URLs to avoid leaking PII via URL params
      if (event.request?.url) {
        event.request.url = event.request.url.split('?')[0]
      }
      return event
    },
  })
}

/**
 * Forward a caught render-time error from <ErrorBoundary> to Sentry.
 * Safe to call whether or not Sentry was initialized — becomes a no-op if not.
 */
export function captureBoundaryError(error: Error, info: { componentStack?: string | null }): void {
  Sentry.withScope((scope) => {
    scope.setTag('source', 'react-error-boundary')
    if (info.componentStack) {
      scope.setContext('react', { componentStack: info.componentStack })
    }
    Sentry.captureException(error)
  })
}
