import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'
import { notify } from '../lib/toast'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import {
  formatNotificationMessage,
  getNotificationIcon,
} from '../lib/notificationDisplay'
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
  type AppNotification,
} from '../services/notifications'
import { ProfilePageSkeleton } from '../components/ui/ProfilePageSkeleton'

export default function NotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setLoading(true)
      try {
        const rows = await getNotificationsForUser(user.id)
        if (!cancelled) {
          setItems(rows)
        }
      } catch (error) {
        console.error('Failed to load notifications:', error)
        notify.error('Could not load notifications.')
      } finally {
        if (!cancelled) {
          setLoading(false)
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

    const refreshNotifications = () => {
      setRefreshTick((tick) => tick + 1)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications()
      }
    }

    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        refreshNotifications
      )
      .subscribe()

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications)
    window.addEventListener('focus', refreshNotifications)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications)
      window.removeEventListener('focus', refreshNotifications)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void supabase.removeChannel(channel)
    }
  }, [user])

  async function handleMarkAllRead() {
    if (!user) return

    try {
      await markAllNotificationsRead(user.id)
      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        }))
      )
    } catch (error) {
      console.error('Failed to mark notifications read:', error)
      notify.error('Could not update notifications.')
    }
  }

  async function handleOpenNotification(item: AppNotification) {
    if (!user) return

    if (!item.readAt) {
      try {
        await markNotificationRead(user.id, item.id)
        setItems((current) =>
          current.map((row) =>
            row.id === item.id
              ? { ...row, readAt: new Date().toISOString() }
              : row
          )
        )
      } catch (error) {
        console.error('Failed to mark notification read:', error)
      }
    }

    if (item.recipeId) {
      navigate(`/recipes/${item.recipeId}`)
      return
    }

    if (item.type === 'follow' && item.actorUsername) {
      navigate(`/users/${item.actorUsername}`)
      return
    }

    if (item.type === 'follow') {
      navigate('/following')
    }
  }

  if (!user) {
    return (
      <section className="profile-page__state-screen">
        <p>Sign in to see notifications about your recipes and followers.</p>
      </section>
    )
  }

  if (loading) {
    return <ProfilePageSkeleton />
  }

  const unreadCount = items.filter((item) => !item.readAt).length

  return (
    <section className="notifications-page profile-page">
      <div className="profile-page__main">
        <div className="profile-page__recipes-header">
          <div>
            <p className="profile-page__stat-label">Inbox</p>
            <h1 className="profile-page__recipes-title">Notifications</h1>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="profile-page__edit-profile-button"
              onClick={() => void handleMarkAllRead()}
            >
              Mark all read
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="profile-page__empty">
            <p className="profile-page__empty-heading">You are all caught up.</p>
            <p>
              Likes, comments, and new followers will appear here as your
              recipes get attention.
            </p>
          </div>
        ) : (
          <ul className="notifications-page__list">
            {items.map((item) => {
              const Icon = getNotificationIcon(item.type)
              const message = formatNotificationMessage(item)

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notifications-page__item ${
                      item.readAt ? '' : 'notifications-page__item--unread'
                    }`}
                    onClick={() => void handleOpenNotification(item)}
                  >
                    <span
                      className={`notifications-page__icon notifications-page__icon--${item.type}`}
                      aria-hidden="true"
                    >
                      <Icon size={18} />
                    </span>

                    <span className="notifications-page__content">
                      <span className="notifications-page__message">
                        {message}
                      </span>
                      {item.recipeTitle ? (
                        <span className="notifications-page__recipe">
                          {item.recipeTitle}
                        </span>
                      ) : null}
                      <time
                        className="notifications-page__time"
                        dateTime={item.createdAt}
                      >
                        {formatRelativeTime(item.createdAt)}
                      </time>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
