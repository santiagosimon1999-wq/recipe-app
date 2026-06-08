/**
 * Full branded hero is reserved for the home/discover route only.
 */
export function isFullHeroRoute(pathname: string): boolean {
  return pathname === '/'
}

/**
 * Short route title for the compact header. Uses plain text (not h1) so pages
 * can keep their own heading hierarchy.
 */
export function getCompactHeaderTitle(pathname: string): string | null {
  if (pathname === '/search') return 'Search recipes'
  if (pathname === '/community') return 'Community'
  if (pathname === '/profile') return 'Profile'
  if (pathname === '/profile/followers') return 'Followers'
  if (pathname === '/profile/following') return 'Following'
  if (pathname === '/saved') return 'Saved recipes'
  if (pathname === '/collections') return 'Collections'
  if (pathname === '/notifications') return 'Notifications'
  if (pathname === '/following') return 'Following'
  if (pathname === '/creator') return 'Creator dashboard'
  if (pathname === '/about') return 'About Savora'
  if (pathname === '/privacy') return 'Privacy'
  if (pathname === '/terms') return 'Terms'
  if (pathname === '/whats-new') return "What's New"
  if (pathname === '/feedback') return 'Feedback'
  if (pathname.startsWith('/recipes/')) return 'Recipe'
  if (pathname.startsWith('/users/')) return 'Creator profile'

  return null
}
