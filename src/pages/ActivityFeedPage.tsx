import { useEffect, useMemo, useState } from 'react'
import { BellRing, ChefHat, Heart, MessageSquareText, UserRoundPlus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/useAuth'
import { getActivityFeedForUser } from '../services/activityFeed'
import type { ActivityEvent } from '../types/ActivityEvent'
import './ActivityFeedPage.css'

const PAGE_SIZE = 20

function formatRelativeTime(isoDate: string): string {
  const timestamp = Date.parse(isoDate)
  if (!Number.isFinite(timestamp)) return 'Just now'

  const diffMs = Date.now() - timestamp
  if (diffMs < 0) return 'Just now'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function activityIcon(type: ActivityEvent['type']) {
  switch (type) {
    case 'recipe_post':
      return <ChefHat size={16} aria-hidden="true" />
    case 'follow':
      return <UserRoundPlus size={16} aria-hidden="true" />
    case 'recipe_like':
      return <Heart size={16} aria-hidden="true" />
    case 'recipe_comment':
      return <MessageSquareText size={16} aria-hidden="true" />
    default:
      return <BellRing size={16} aria-hidden="true" />
  }
}

function activityText(event: ActivityEvent): string {
  const actor = event.actor.displayName
  const grouped = event.groupCount > 1

  if (event.type === 'recipe_post') {
    if (grouped) {
      return `${actor} posted ${event.groupCount} new recipes`
    }
    return `${actor} posted ${event.recipe?.title ?? 'a new recipe'}`
  }

  if (event.type === 'follow') {
    if (grouped) {
      return `${actor} followed ${event.groupCount} chefs`
    }
    return `${actor} followed ${event.targetUser?.displayName ?? 'a chef'}`
  }

  if (event.type === 'recipe_like') {
    if (grouped) {
      return `${actor} liked ${event.groupCount} recipes`
    }
    return `${actor} liked ${event.recipe?.title ?? 'a recipe'}`
  }

  if (grouped) {
    return `${actor} commented on ${event.groupCount} recipes`
  }
  return `${actor} commented on ${event.recipe?.title ?? 'a recipe'}`
}

export default function ActivityFeedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setLoading(true)
      try {
        const result = await getActivityFeedForUser(user.id)
        if (!cancelled) {
          setEvents(result.events)
          setFollowingCount(result.followingCount)
          setVisibleCount(PAGE_SIZE)
        }
      } catch (error) {
        console.error('Failed to load activity feed:', error)
        if (!cancelled) {
          setEvents([])
          setFollowingCount(0)
          setVisibleCount(PAGE_SIZE)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  const totalItems = useMemo(() => events.length, [events])
  const visibleEvents = useMemo(
    () => events.slice(0, visibleCount),
    [events, visibleCount]
  )
  const canLoadMore = visibleCount < events.length

  function handleOpenEvent(event: ActivityEvent) {
    if (event.type === 'follow') {
      const username = event.targetUser?.username?.trim()
      if (username) {
        navigate(`/users/${encodeURIComponent(username)}`)
      }
      return
    }

    if (event.recipe?.id) {
      navigate(`/recipes/${event.recipe.id}`)
    }
  }

  return (
    <section className="recipe-section community-feed-page activity-feed">
      <div className="recipe-section__header">
        <div>
          <p className="app-eyebrow">Activity</p>
          <h2>Latest social activity from chefs you follow</h2>
        </div>
        {user && !loading ? <span>{totalItems} items</span> : null}
      </div>

      {!user ? (
        <p className="community-feed__intro">
          Sign in to see posts, follows, likes, and comments from people you follow.
        </p>
      ) : loading ? (
        <p className="community-feed__intro">Loading activity…</p>
      ) : followingCount === 0 ? (
        <div className="profile-page__empty">
          <p className="profile-page__empty-heading">Your activity feed is quiet.</p>
          <p>
            Follow chefs from community profiles to see their latest recipes and
            social activity here.
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="profile-page__empty">
          <p className="profile-page__empty-heading">
            No recent activity from chefs you follow.
          </p>
          <p>Check back soon or follow more chefs to keep your feed active.</p>
        </div>
      ) : (
        <>
          <ul className="activity-feed__list">
            {visibleEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className="activity-feed__card"
                  onClick={() => handleOpenEvent(event)}
                >
                  <div className="activity-feed__avatar">
                    {event.actor.avatarUrl ? (
                      <img src={event.actor.avatarUrl} alt="" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">
                        {event.actor.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="activity-feed__content">
                    <div className="activity-feed__meta">
                      <span className="activity-feed__type-badge">
                        {activityIcon(event.type)}
                        {event.type === 'recipe_post'
                          ? 'Post'
                          : event.type === 'follow'
                            ? 'Follow'
                            : event.type === 'recipe_like'
                              ? 'Like'
                              : 'Comment'}
                      </span>
                      <time dateTime={event.createdAt} className="activity-feed__time">
                        {formatRelativeTime(event.createdAt)}
                      </time>
                    </div>

                    <p className="activity-feed__text">{activityText(event)}</p>

                    {event.commentPreview && event.groupCount === 1 ? (
                      <p className="activity-feed__comment-preview">
                        “{event.commentPreview}”
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {canLoadMore ? (
            <div className="activity-feed__load-more">
              <button
                type="button"
                className="profile-page__edit-profile-button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load more activity
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
