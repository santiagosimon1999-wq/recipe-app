import { describe, expect, it } from 'vitest'
import {
  HOME_COMMUNITY_PREVIEW_LIMIT,
  HOME_INSPIRATION_PREVIEW_LIMIT,
  HOME_SAVED_PREVIEW_LIMIT,
} from './homeDashboard'

describe('homeDashboard constants', () => {
  it('keeps home previews smaller than a full community feed', () => {
    expect(HOME_COMMUNITY_PREVIEW_LIMIT).toBeLessThanOrEqual(8)
    expect(HOME_SAVED_PREVIEW_LIMIT).toBeLessThanOrEqual(6)
    expect(HOME_INSPIRATION_PREVIEW_LIMIT).toBeLessThanOrEqual(4)
  })
})
