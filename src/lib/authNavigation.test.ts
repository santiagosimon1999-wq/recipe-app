import { describe, expect, it } from 'vitest'
import {
  buildAuthReturnPath,
  getProtectedRouteAuthReason,
  resolveSafeRedirectPath,
} from './authNavigation'

describe('resolveSafeRedirectPath', () => {
  it('allows internal app paths', () => {
    expect(resolveSafeRedirectPath('/')).toBe('/')
    expect(resolveSafeRedirectPath('/community')).toBe('/community')
    expect(resolveSafeRedirectPath('/recipes/42')).toBe('/recipes/42')
    expect(resolveSafeRedirectPath('/search?q=pasta')).toBe('/search?q=pasta')
  })

  it('rejects external and unsafe paths', () => {
    expect(resolveSafeRedirectPath('https://evil.com')).toBeNull()
    expect(resolveSafeRedirectPath('//evil.com')).toBeNull()
    expect(resolveSafeRedirectPath('')).toBeNull()
    expect(resolveSafeRedirectPath('/http://evil.com')).toBeNull()
  })
})

describe('getProtectedRouteAuthReason', () => {
  it('returns contextual copy for protected routes', () => {
    expect(getProtectedRouteAuthReason('/saved')).toMatch(/save recipes/i)
    expect(getProtectedRouteAuthReason('/collections')).toMatch(
      /organize saved recipes/i
    )
    expect(getProtectedRouteAuthReason('/notifications')).toMatch(/likes, comments/i)
    expect(getProtectedRouteAuthReason('/profile')).toMatch(/share recipes/i)
  })
})

describe('buildAuthReturnPath', () => {
  it('combines pathname, search, and hash', () => {
    expect(buildAuthReturnPath('/search', '?q=soup', '#results')).toBe(
      '/search?q=soup#results',
    )
  })
})
