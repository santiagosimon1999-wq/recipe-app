import type { AuthIntent } from './authNavigation'

export type MoreMenuRouteItem = {
  id: string
  label: string
  /** Shorter label for compact desktop dropdown items */
  navLabel?: string
  route: string
  requiresAuth: boolean
  authIntent?: AuthIntent
}

export const MORE_MENU_ACCOUNT_LOGGED_IN: MoreMenuRouteItem[] = [
  {
    id: 'creator',
    label: 'Creator Dashboard',
    navLabel: 'Creator',
    route: '/creator',
    requiresAuth: true,
    authIntent: 'login',
  },
  {
    id: 'following',
    label: 'Following',
    route: '/following',
    requiresAuth: true,
    authIntent: 'login',
  },
  {
    id: 'saved',
    label: 'Saved Recipes',
    navLabel: 'Saved',
    route: '/saved',
    requiresAuth: true,
    authIntent: 'signup',
  },
  {
    id: 'collections',
    label: 'Collections',
    route: '/collections',
    requiresAuth: true,
    authIntent: 'signup',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    route: '/notifications',
    requiresAuth: true,
    authIntent: 'login',
  },
  { id: 'profile', label: 'Profile', route: '/profile', requiresAuth: true },
]

const MORE_MENU_ACTIVE_ROUTE_PREFIXES = ['/following']

export function getMoreMenuItemLabel(item: MoreMenuRouteItem): string {
  return item.navLabel ?? item.label
}

export function isMoreMenuActiveRoute(pathname: string): boolean {
  if (
    MORE_MENU_APP_LINKS.some((item) => pathname === item.route) ||
    MORE_MENU_ACCOUNT_LOGGED_IN.some(
      (item) =>
        pathname === item.route || pathname.startsWith(`${item.route}/`),
    ) ||
    MORE_MENU_ACCOUNT_SIGNED_OUT.some((item) => pathname === item.route)
  ) {
    return true
  }

  return MORE_MENU_ACTIVE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export const MORE_MENU_ACCOUNT_SIGNED_OUT: MoreMenuRouteItem[] = [
  {
    id: 'saved',
    label: 'Saved Recipes',
    route: '/saved',
    requiresAuth: true,
    authIntent: 'signup',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    route: '/notifications',
    requiresAuth: true,
    authIntent: 'login',
  },
  {
    id: 'profile',
    label: 'Profile',
    route: '/profile',
    requiresAuth: true,
    authIntent: 'login',
  },
]

export const MORE_MENU_APP_LINKS: MoreMenuRouteItem[] = [
  { id: 'whats-new', label: "What's New", route: '/whats-new', requiresAuth: false },
  { id: 'about', label: 'About Savora', route: '/about', requiresAuth: false },
  { id: 'privacy', label: 'Privacy', route: '/privacy', requiresAuth: false },
  { id: 'terms', label: 'Terms', route: '/terms', requiresAuth: false },
  { id: 'feedback', label: 'Feedback', route: '/feedback', requiresAuth: false },
]

export const MORE_MENU_REQUIRED_APP_LABELS = [
  "What's New",
  'About Savora',
  'Privacy',
  'Terms',
  'Feedback',
] as const

export const MORE_MENU_REQUIRED_ACCOUNT_LABELS = [
  'Saved Recipes',
  'Collections',
  'Following',
  'Creator Dashboard',
] as const
