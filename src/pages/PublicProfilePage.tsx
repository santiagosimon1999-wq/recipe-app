import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Recipe } from '../types/Recipe'
import type { PublicProfile } from '../types/Profile'
import {
  getProfileByUsername,
  getPublicRecipesByUserId,
  type PublicRecipeRow,
} from '../lib/profileService'

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70'

function getAvatarInitials(name: string | null | undefined): string {
  const source = (name?.trim() || '').replace(/[^a-zA-Z\s]/g, ' ')
  if (!source) return 'S'

  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function mapPublicRecipeRow(row: PublicRecipeRow, profileUsername: string | null): Recipe {
  return {
    id: row.id,
    title: row.title,
    image: row.image_url ?? '',
    imageFile: null,
    description: row.description,
    category: row.category,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    ingredients: row.ingredients,
    instructions: row.instructions,
    source: 'community',
    userId: row.user_id,
    authorName: row.author_name ?? 'Savora Chef',
    authorUsername: profileUsername ?? undefined,
    isPublic: row.is_public,
    likeCount: 0,
    liked: false,
  }
}

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>()
  const navigate = useNavigate()
  const username = params.username ?? ''

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
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

        const publicRows = await getPublicRecipesByUserId(foundProfile.id)
        if (cancelled) return

        setRecipes(
          publicRows.map((row) =>
            mapPublicRecipeRow(row, foundProfile.username)
          )
        )
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
    return (
      <section className="profile-page__state-screen">
        <p>Loading profile…</p>
      </section>
    )
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
          </div>
        </aside>

        <div className="profile-page__main">
          <div className="profile-page__stats-grid">
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Public recipes</p>
              <p className="profile-page__stat-value">{recipes.length}</p>
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

            {recipes.length === 0 ? (
              <div className="profile-page__empty">
                <p className="profile-page__empty-heading">
                  No public recipes yet.
                </p>
                <p>
                  {displayName} hasn't shared any public recipes yet. Check back
                  soon.
                </p>
              </div>
            ) : (
              <div className="profile-page__recipe-grid">
                {recipes.map((recipe) => (
                  <article
                    key={recipe.id}
                    className="profile-page__recipe-card"
                  >
                    <div className="profile-page__recipe-thumb">
                      <img
                        src={recipe.image || FALLBACK_THUMB}
                        alt={recipe.title}
                        className="profile-page__recipe-thumb-img"
                      />
                    </div>
                    <div className="profile-page__recipe-body">
                      <span className="profile-page__recipe-category">
                        {recipe.category}
                      </span>
                      <h3 className="profile-page__recipe-title">
                        {recipe.title}
                      </h3>
                      <p className="profile-page__recipe-description">
                        {recipe.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {error ? <p className="profile-page__error">{error}</p> : null}
        </div>
      </div>
    </section>
  )
}
