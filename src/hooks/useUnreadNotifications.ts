import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getUnreadNotificationCount } from '../services/notifications'

export function useUnreadNotifications(user: User | null) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const unread = await getUnreadNotificationCount(user.id)
        if (!cancelled) setCount(unread)
      } catch (error) {
        console.error('Failed to load notification count:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  return count
}
