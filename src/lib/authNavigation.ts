export const AUTH_ENTRY_ROUTE = '/profile'

export type AuthIntent = 'login' | 'signup'

export type AuthNavigationState = {
  authTab?: AuthIntent
  from?: string
  reason?: string
}

export const DEFAULT_AUTH_PROMPT_MESSAGE =
  'Create an account to save recipes, comment, and follow creators.'

const PROTECTED_ROUTE_REASONS: Record<string, string> = {
  '/profile':
    'Create your profile to share recipes and follow creators.',
  '/saved':
    'Create an account to save recipes and build your personal cookbook.',
  '/notifications':
    'Log in to see likes, comments, and follows.',
  '/creator':
    'Log in to view your Creator Dashboard and track recipe performance.',
  '/following':
    'Log in to see posts, follows, likes, and comments from people you follow.',
  '/collections':
    'Create an account to save recipes and organize them into collections.',
}

/**
 * Validates an internal app path for post-auth redirect.
 * Rejects external URLs, protocol-relative paths, and malformed values.
 */
export function resolveSafeRedirectPath(from?: string): string | null {
  if (!from || typeof from !== 'string') return null

  const trimmed = from.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  if (trimmed.includes('://')) return null
  if (/[\n\r]/.test(trimmed)) return null

  return trimmed
}

export function getProtectedRouteAuthReason(pathname: string): string | undefined {
  if (PROTECTED_ROUTE_REASONS[pathname]) {
    return PROTECTED_ROUTE_REASONS[pathname]
  }

  if (pathname.startsWith('/following/')) {
    return PROTECTED_ROUTE_REASONS['/following']
  }

  return undefined
}

export function buildAuthReturnPath(
  pathname: string,
  search = '',
  hash = '',
): string {
  return `${pathname}${search}${hash}` || '/'
}
