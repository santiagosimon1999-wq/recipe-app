import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/useAuth'
import { getCreatorDashboard } from '../services/creatorDashboard'
import type { CreatorDashboardData } from '../types/CreatorDashboard'
import './CreatorDashboardPage.css'

function formatCompactDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatRelativeTime(isoDate: string): string {
  const timestamp = Date.parse(isoDate)
  if (!Number.isFinite(timestamp)) return 'Just now'

  const diffMs = Date.now() - timestamp
  if (diffMs < 60_000) return 'Just now'

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return formatCompactDate(isoDate)
}

export default function CreatorDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<CreatorDashboardData | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getCreatorDashboard(user.id)
        if (!cancelled) {
          setDashboard(data)
        }
      } catch (loadError) {
        console.error('Failed to load creator dashboard:', loadError)
        if (!cancelled) {
          setError('Unable to load your creator dashboard. Please try again.')
          setDashboard(null)
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

  const kpis = dashboard?.kpis

  const profileCompletenessLabel = useMemo(() => {
    if (!dashboard) return '0%'
    return `${dashboard.profileCompleteness.score}%`
  }, [dashboard])

  if (!user) {
    return (
      <section className="profile-page__state-screen">
        <p>Sign in to view your Creator Dashboard.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="profile-page__state-screen">
        <p>Loading your creator dashboard…</p>
      </section>
    )
  }

  if (error || !dashboard || !kpis) {
    return (
      <section className="profile-page__state-screen">
        <p>{error ?? 'Unable to load the creator dashboard.'}</p>
      </section>
    )
  }

  if (!dashboard.hasPublicRecipes) {
    return (
      <section className="creator-dashboard profile-page">
        <div className="creator-dashboard__empty profile-page__empty">
          <p className="profile-page__empty-heading">
            Your Creator Dashboard is ready for your first public recipe.
          </p>
          <p>
            Publish a recipe to unlock engagement insights like likes, comments,
            and top-performing dishes.
          </p>
          <button
            type="button"
            className="profile-page__edit-profile-button"
            onClick={() => navigate('/')}
          >
            Create your first recipe
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="creator-dashboard profile-page">
      <header className="creator-dashboard__header">
        <div>
          <p className="app-eyebrow">Creator</p>
          <h2 className="creator-dashboard__title">Creator Dashboard</h2>
        </div>
        <span className="creator-dashboard__pill">
          Profile completeness {profileCompletenessLabel}
        </span>
      </header>

      <div className="creator-dashboard__kpi-grid">
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">Public recipes</p>
          <p className="profile-page__stat-value">{kpis.publicRecipesCount}</p>
        </article>
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">Likes received</p>
          <p className="profile-page__stat-value">{kpis.totalLikesReceived}</p>
        </article>
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">Comments received</p>
          <p className="profile-page__stat-value">{kpis.totalCommentsReceived}</p>
        </article>
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">Followers</p>
          <p className="profile-page__stat-value">{kpis.followersCount}</p>
        </article>
      </div>

      <div className="creator-dashboard__kpi-grid creator-dashboard__kpi-grid--secondary">
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">New followers (7d)</p>
          <p className="profile-page__stat-value">{kpis.newFollowers7d}</p>
        </article>
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">New followers (30d)</p>
          <p className="profile-page__stat-value">{kpis.newFollowers30d}</p>
        </article>
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">Recipes published (7d)</p>
          <p className="profile-page__stat-value">{kpis.recipesPublished7d}</p>
        </article>
        <article className="creator-dashboard__kpi-card">
          <p className="profile-page__stat-label">Recipes published (30d)</p>
          <p className="profile-page__stat-value">{kpis.recipesPublished30d}</p>
        </article>
      </div>

      <div className="creator-dashboard__content-grid">
        <section className="creator-dashboard__panel">
          <div className="creator-dashboard__panel-header">
            <p className="profile-page__stat-label">Top recipes</p>
            <h3 className="creator-dashboard__panel-title">
              Top 5 by likes (tie-break: comments)
            </h3>
          </div>

          <ol className="creator-dashboard__top-list">
            {dashboard.topRecipes.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  className="creator-dashboard__list-button"
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                >
                  <div className="creator-dashboard__list-main">
                    <p className="creator-dashboard__list-title">{recipe.title}</p>
                    <p className="creator-dashboard__list-subtitle">
                      Published {formatCompactDate(recipe.publishedAt)}
                    </p>
                  </div>
                  <div className="creator-dashboard__badges">
                    <span>{recipe.likeCount} likes</span>
                    <span>{recipe.commentCount} comments</span>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="creator-dashboard__panel">
          <div className="creator-dashboard__panel-header">
            <p className="profile-page__stat-label">Recent comments</p>
            <h3 className="creator-dashboard__panel-title">
              Latest feedback on your public recipes
            </h3>
          </div>

          {dashboard.recentComments.length === 0 ? (
            <div className="profile-page__empty creator-dashboard__mini-empty">
              <p className="profile-page__empty-heading">No comments yet.</p>
              <p>Comments on your public recipes will appear here.</p>
            </div>
          ) : (
            <ul className="creator-dashboard__comment-list">
              {dashboard.recentComments.map((comment) => (
                <li key={comment.id}>
                  <button
                    type="button"
                    className="creator-dashboard__list-button creator-dashboard__list-button--comment"
                    onClick={() => navigate(`/recipes/${comment.recipeId}`)}
                  >
                    <div className="creator-dashboard__list-main">
                      <p className="creator-dashboard__list-subtitle">
                        {comment.authorDisplayName} on {comment.recipeTitle}
                      </p>
                      <p className="creator-dashboard__comment-text">
                        “{comment.content}”
                      </p>
                    </div>
                    <time
                      className="creator-dashboard__comment-time"
                      dateTime={comment.createdAt}
                    >
                      {formatRelativeTime(comment.createdAt)}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  )
}
