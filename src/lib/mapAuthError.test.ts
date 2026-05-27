import { describe, expect, it } from 'vitest'
import { mapAuthError } from './mapAuthError'

describe('mapAuthError', () => {
  it('maps invalid login credentials', () => {
    expect(
      mapAuthError(new Error('Invalid login credentials'), 'login')
    ).toBe('Email or password is incorrect.')
  })

  it('maps duplicate signup email', () => {
    expect(
      mapAuthError(new Error('User already registered'), 'signup')
    ).toBe('An account with this email already exists. Try logging in.')
  })

  it('maps weak password messages', () => {
    expect(
      mapAuthError(new Error('Password should be at least 8 characters'), 'signup')
    ).toBe('Password must be at least 8 characters.')
  })

  it('maps invalid email messages', () => {
    expect(
      mapAuthError(new Error('Invalid email address'), 'signup')
    ).toBe('Please enter a valid email address.')
  })

  it('maps network failures', () => {
    expect(mapAuthError(new Error('Failed to fetch'), 'login')).toBe(
      'Network error. Please check your connection and try again.'
    )
  })

  it('falls back to context-specific generic messages', () => {
    expect(mapAuthError('something unexpected', 'login')).toBe(
      'Unable to log in. Please try again.'
    )
    expect(mapAuthError('something unexpected', 'signup')).toBe(
      'Unable to create account. Please try again.'
    )
  })
})
