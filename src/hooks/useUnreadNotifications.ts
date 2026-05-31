import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getUnreadNotificationCount,
  NOTIFICATIONS_UPDATED_EVENT,
} from '../services/notifications'

export function useUnreadNotifications(user: User | null) {
  const [count, setCount] = useState(0)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setCount(0)
        }
      })
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      try {
        const unread = await getUnreadNotificationCount(user.id)
        if (!cancelled) setCount(unread)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load notification count:', error)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, refreshTick])

  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    const handleNotificationsUpdated = () => {
      setRefreshTick((tick) => tick + 1)
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated)
    return () => {
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        handleNotificationsUpdated
      )
    }
  }, [user])

  return count
}
