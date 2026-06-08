import { describe, expect, it } from 'vitest'
import {
  isMoreMenuActiveRoute,
  MORE_MENU_ACCOUNT_LOGGED_IN,
  MORE_MENU_ACCOUNT_SIGNED_OUT,
  MORE_MENU_APP_LINKS,
  MORE_MENU_REQUIRED_ACCOUNT_LABELS,
  MORE_MENU_REQUIRED_APP_LABELS,
} from './moreMenu'

describe('moreMenu', () => {
  it('includes required app links for the More sheet', () => {
    const labels = MORE_MENU_APP_LINKS.map((item) => item.label)
    for (const label of MORE_MENU_REQUIRED_APP_LABELS) {
      expect(labels).toContain(label)
    }
  })

  it('includes required logged-in account destinations', () => {
    const labels = MORE_MENU_ACCOUNT_LOGGED_IN.map((item) => item.label)
    expect(labels).toContain('Profile')
    expect(labels).toContain('Notifications')
    for (const label of MORE_MENU_REQUIRED_ACCOUNT_LABELS) {
      expect(labels).toContain(label)
    }
  })

  it('includes signed-out protected teasers', () => {
    const labels = MORE_MENU_ACCOUNT_SIGNED_OUT.map((item) => item.label)
    expect(labels).toEqual(
      expect.arrayContaining(['Saved Recipes', 'Notifications', 'Profile']),
    )
    expect(
      MORE_MENU_ACCOUNT_SIGNED_OUT.every((item) => item.requiresAuth),
    ).toBe(true)
  })

  it('marks app links as public routes', () => {
    expect(MORE_MENU_APP_LINKS.every((item) => !item.requiresAuth)).toBe(true)
    expect(MORE_MENU_APP_LINKS.map((item) => item.route)).toEqual([
      '/whats-new',
      '/about',
      '/privacy',
      '/terms',
      '/feedback',
    ])
  })

  it('detects active routes covered by the More menu', () => {
    expect(isMoreMenuActiveRoute('/saved')).toBe(true)
    expect(isMoreMenuActiveRoute('/creator')).toBe(true)
    expect(isMoreMenuActiveRoute('/following/feed')).toBe(true)
    expect(isMoreMenuActiveRoute('/about')).toBe(true)
    expect(isMoreMenuActiveRoute('/community')).toBe(false)
  })
})
