import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/useAuth'
import { notify } from '../lib/toast'
import { getAvatarInitials } from '../lib/userUtils'
import {
  getFollowersForUser,
  getFollowingForUser,
  type FollowListProfile,
  unfollowUser,
} from '../services/follows'
import './FollowListPage.css'

type FollowListMode = 'followers' | 'following'

type FollowListPageProps = {
  mode: FollowListMode
}

function getProfileDisplayName(profile: FollowListProfile): string {
  const displayName = profile.display_name?.trim()
  if (displayName) return displayName
  const username = profile.username?.trim()
  if (username) return `@${username}`
  return 'Savora member'
}

export default function FollowListPage({ mode }: FollowListPageProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<FollowListProfile[]>([])
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pageTitle = mode === 'followers' ? 'Followers' : 'Following'
  const emptyTitle =
    mode === 'followers' ? 'No followers yet.' : 'You are not following anyone yet.'
  const emptyBody =
    mode === 'followers'
      ? 'Share more public recipes so other chefs can discover and follow you.'
      : 'Explore public profiles and follow chefs to build your feed.'

  const itemCountLabel = useMemo(() => {
    const count = profiles.length
    const noun = mode === 'followers' ? 'follower' : 'following'
    return `${count} ${noun}${count === 1 ? '' : 's'}`
  }, [mode, profiles.length])

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
        const rows =
          mode === 'followers'
            ? await getFollowersForUser(user.id)
            : await getFollowingForUser(user.id)

        if (!cancelled) {
          setProfiles(rows)
        }
      } catch (loadError) {
        console.error(`Failed to load ${mode}:`, loadError)
        if (!cancelled) {
          setProfiles([])
          setError(`Unable to load your ${mode} right now. Please try again.`)
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
  }, [mode, user])

  async function handleUnfollow(targetUserId: string) {
    if (!user || busyUserId) return

    setBusyUserId(targetUserId)
    try {
      await unfollowUser(user.id, targetUserId)
      setProfiles((current) => current.filter((profile) => profile.id !== targetUserId))
      notify.success('Unfollowed successfully.')
    } catch (unfollowError) {
      console.error('Failed to unfollow user:', unfollowError)
      notify.error('Could not unfollow right now. Please try again.')
    } finally {
      setBusyUserId(null)
    }
  }

  if (!user) {
    return (
      <section className="profile-page__state-screen">
        <p>Sign in to view your {pageTitle.toLowerCase()}.</p>
      </section>
    )
  }

  return (
    <section className="follow-list-page profile-page">
      <header className="follow-list-page__header">
        <div>
          <p className="app-eyebrow">Profile</p>
          <h2 className="follow-list-page__title">{pageTitle}</h2>
        </div>
        {!loading && !error ? (
          <span className="follow-list-page__count">{itemCountLabel}</span>
        ) : null}
      </header>

      {loading ? (
        <section className="profile-page__state-screen">
          <p>Loading {pageTitle.toLowerCase()}…</p>
        </section>
      ) : error ? (
        <p className="profile-page__error">{error}</p>
      ) : profiles.length === 0 ? (
        <div className="profile-page__empty">
          <p className="profile-page__empty-heading">{emptyTitle}</p>
          <p>{emptyBody}</p>
        </div>
      ) : (
        <ul className="follow-list-page__list">
          {profiles.map((profile) => {
            const displayName = getProfileDisplayName(profile)
            const hasUsername = Boolean(profile.username?.trim())
            const profileUrl = hasUsername
              ? `/users/${encodeURIComponent(profile.username!.trim())}`
              : null

            return (
              <li key={profile.id} className="follow-list-page__item">
                <div
                  className={
                    profile.avatar_url
                      ? 'follow-list-page__avatar'
                      : 'follow-list-page__avatar follow-list-page__avatar--fallback'
                  }
                  aria-hidden={!profile.avatar_url}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" aria-hidden="true" />
                  ) : (
                    <span>{getAvatarInitials(displayName)}</span>
                  )}
                </div>

                <div className="follow-list-page__content">
                  <p className="follow-list-page__name">{displayName}</p>
                  <p className="follow-list-page__handle">
                    {hasUsername ? `@${profile.username}` : 'No public username yet'}
                  </p>
                </div>

                <div className="follow-list-page__actions">
                  {profileUrl ? (
                    <Link
                      to={profileUrl}
                      className="follow-list-page__link profile-page__edit-profile-button"
                    >
                      View profile
                    </Link>
                  ) : (
                    <span className="follow-list-page__missing-link">Profile unavailable</span>
                  )}

                  {mode === 'following' ? (
                    <button
                      type="button"
                      className="follow-list-page__unfollow profile-page__cancel-button"
                      onClick={() => void handleUnfollow(profile.id)}
                      disabled={busyUserId === profile.id}
                    >
                      {busyUserId === profile.id ? 'Unfollowing…' : 'Unfollow'}
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
