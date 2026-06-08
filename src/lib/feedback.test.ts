import { describe, expect, it } from 'vitest'
import {
  getFeedbackEmail,
  getFeedbackMailto,
  isFeedbackConfigured,
} from './feedback'

describe('feedback helpers', () => {
  it('returns null when env is unset', () => {
    expect(getFeedbackEmail()).toBeNull()
    expect(isFeedbackConfigured()).toBe(false)
  })

  it('returns null mailto when env is unset', () => {
    expect(getFeedbackMailto()).toBeNull()
  })
})
