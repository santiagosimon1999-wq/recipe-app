import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
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
    if (!user || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const refreshUnreadCount = () => {
      setRefreshTick((tick) => tick + 1)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUnreadCount()
      }
    }

    const channel = supabase
      .channel(`notifications-unread-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        refreshUnreadCount
      )
      .subscribe()

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshUnreadCount)
    window.addEventListener('focus', refreshUnreadCount)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshUnreadCount)
      window.removeEventListener('focus', refreshUnreadCount)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void supabase.removeChannel(channel)
    }
  }, [user])

  return count
}
