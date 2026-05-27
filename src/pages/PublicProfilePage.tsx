import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Recipe } from '../types/Recipe'
import type { PublicProfile } from '../types/Profile'
import FollowButton from '../components/FollowButton'
import ProfileRecipeGrid from '../components/ProfileRecipeGrid'
import {
  getProfileByUsername,
  getPublicRecipesByUserId,
} from '../lib/profileService'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
import { ProfilePageSkeleton } from '../components/ui/ProfilePageSkeleton'
import { getAvatarInitials } from '../lib/userUtils'
import { getFollowCounts, type FollowCounts } from '../services/follows'

type PublicProfilePageProps = {
  onSelectRecipe: (recipe: Recipe) => void
}

export default function PublicProfilePage({
  onSelectRecipe,
}: PublicProfilePageProps) {
  const params = useParams<{ username: string }>()
  const navigate = useNavigate()
  const username = params.username ?? ''

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [followCounts, setFollowCounts] = useState<FollowCounts>({
    followers: 0,
    following: 0,
  })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleBack() {
    navigate(-1)
  }

  const displayName = useMemo(
    () => profile?.display_name || profile?.username || username,
    [profile, username]
  )

  const avatarInitials = useMemo(
    () => getAvatarInitials(displayName),
    [displayName]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)
      setError(null)
      setRecipes([])

      try {
        const foundProfile = await getProfileByUsername(username)

        if (cancelled) return

        if (!foundProfile) {
          setProfile(null)
          setNotFound(true)
          setLoading(false)
          return
        }

        setProfile(foundProfile)

        const [publicRows, counts] = await Promise.all([
          getPublicRecipesByUserId(foundProfile.id),
          getFollowCounts(foundProfile.id),
        ])

        if (cancelled) return

        setRecipes(publicRows.map((row) => mapDbRowToRecipe(row)))
        setFollowCounts(counts)
      } catch (err) {
        console.error('Failed to load public profile:', err)
        if (cancelled) return
        setError('Unable to load this profile. Please try again later.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [username])

  if (loading) {
    return <ProfilePageSkeleton />
  }

  if (notFound) {
    return (
      <section className="profile-page__state-screen">
        <p>
          We couldn't find a profile for <strong>@{username}</strong>.
        </p>
        <button
          type="button"
          className="profile-page__edit-profile-button"
          onClick={handleBack}
        >
          Go back
        </button>
      </section>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <section className="profile-page">
      <div className="public-profile__back-row">
        <button
          type="button"
          className="public-profile__back-button"
          onClick={handleBack}
        >
          ← Back
        </button>
      </div>

      <div className="profile-page__layout">
        <aside className="profile-page__sidebar">
          <div
            className={
              profile.avatar_url
                ? 'profile-page__avatar-wrapper'
                : 'profile-page__avatar-wrapper profile-page__avatar-wrapper--default'
            }
            aria-hidden={!profile.avatar_url}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${displayName} avatar`}
                className="profile-page__avatar-img"
              />
            ) : (
              <span
                className="profile-page__avatar-initial"
                aria-label={`${displayName} initials`}
              >
                {avatarInitials}
              </span>
            )}
          </div>

          <div className="profile-page__info-card">
            {profile.username ? (
              <p className="profile-page__handle">@{profile.username}</p>
            ) : null}
            <h1 className="profile-page__display-name">{displayName}</h1>

            {profile.bio ? (
              <p className="profile-page__bio">{profile.bio}</p>
            ) : null}

            <FollowButton
              targetUserId={profile.id}
              targetDisplayName={displayName}
              className="public-profile__follow-button"
            />
          </div>
        </aside>

        <div className="profile-page__main">
          <div className="profile-page__stats-grid">
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Public recipes</p>
              <p className="profile-page__stat-value">{recipes.length}</p>
            </div>
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Followers</p>
              <p className="profile-page__stat-value">{followCounts.followers}</p>
            </div>
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Following</p>
              <p className="profile-page__stat-value">{followCounts.following}</p>
            </div>
          </div>

          <section className="profile-page__recipes-section">
            <div className="profile-page__recipes-header">
              <div>
                <p className="profile-page__stat-label">Shared recipes</p>
                <h2 className="profile-page__recipes-title">
                  Recipes from {displayName}
                </h2>
              </div>
            </div>

            <ProfileRecipeGrid
              recipes={recipes}
              onSelectRecipe={onSelectRecipe}
              emptyHeading="No public recipes yet."
              emptyBody={`${displayName} hasn't shared any public recipes yet. Check back soon.`}
            />
          </section>

          {error ? <p className="profile-page__error">{error}</p> : null}
        </div>
      </div>
    </section>
  )
}
