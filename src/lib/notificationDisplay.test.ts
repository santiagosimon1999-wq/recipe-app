import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './formatRelativeTime'
import {
  formatNotificationMessage,
  getNotificationIcon,
} from './notificationDisplay'
import { Heart, MessageSquareText, UserRoundPlus } from 'lucide-react'
import type { AppNotification } from '../services/notifications'

function makeNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: '1',
    type: 'like',
    message: 'Someone liked your recipe.',
    actorId: 'actor-1',
    actorUsername: 'chef_maya',
    actorDisplayName: 'Maya',
    recipeId: 42,
    recipeTitle: 'Creamy Tuscan Pasta',
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('formatRelativeTime', () => {
  it('formats minutes and hours ago', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    expect(formatRelativeTime(twoMinutesAgo)).toBe('2m ago')
    expect(formatRelativeTime(oneHourAgo)).toBe('1h ago')
  })

  it('formats yesterday', () => {
    const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(yesterday)).toBe('Yesterday')
  })
})

describe('formatNotificationMessage', () => {
  it('formats like notifications with username', () => {
    expect(formatNotificationMessage(makeNotification({ type: 'like' }))).toBe(
      '@chef_maya liked your recipe',
    )
  })

  it('formats comment notifications with username', () => {
    expect(
      formatNotificationMessage(makeNotification({ type: 'comment' })),
    ).toBe('@chef_maya commented on your recipe')
  })

  it('formats follow notifications with username', () => {
    expect(
      formatNotificationMessage(
        makeNotification({
          type: 'follow',
          recipeId: null,
          recipeTitle: null,
        }),
      ),
    ).toBe('@chef_maya started following you')
  })

  it('falls back when username is missing', () => {
    expect(
      formatNotificationMessage(
        makeNotification({
          actorUsername: null,
          actorDisplayName: 'Maya',
        }),
      ),
    ).toBe('Maya liked your recipe')
  })
})

describe('getNotificationIcon', () => {
  it('returns the correct icon component per type', () => {
    expect(getNotificationIcon('like')).toBe(Heart)
    expect(getNotificationIcon('comment')).toBe(MessageSquareText)
    expect(getNotificationIcon('follow')).toBe(UserRoundPlus)
  })
})
