import { describe, expect, it } from 'vitest'
import { getCompactHeaderTitle, isFullHeroRoute } from './headerRoutes'

describe('headerRoutes', () => {
  it('uses full hero only on home', () => {
    expect(isFullHeroRoute('/')).toBe(true)
    expect(isFullHeroRoute('/search')).toBe(false)
    expect(isFullHeroRoute('/community')).toBe(false)
  })

  it('returns compact titles for inner routes', () => {
    expect(getCompactHeaderTitle('/search')).toBe('Search recipes')
    expect(getCompactHeaderTitle('/community')).toBe('Community')
    expect(getCompactHeaderTitle('/saved')).toBe('Saved recipes')
    expect(getCompactHeaderTitle('/recipes/42')).toBe('Recipe')
    expect(getCompactHeaderTitle('/users/chef')).toBe('Creator profile')
  })

  it('returns null for unknown routes', () => {
    expect(getCompactHeaderTitle('/unknown-page')).toBeNull()
  })
})
