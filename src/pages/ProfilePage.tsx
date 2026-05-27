import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Recipe } from '../types/Recipe'
import type { Profile } from '../types/Profile'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'
import {
  getProfileById,
  getPublicRecipesByUserId,
  getRecipeCountByUserId,
  logSupabaseError,
} from '../lib/profileService'
import { mapDbRowToRecipe } from '../lib/recipeMappers'

function getFallbackUserName(email: string | null | undefined) {
  if (!email) return 'Savora'
  return email.split('@')[0]
}

function getAvatarInitials(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  const source = (name?.trim() || email?.trim() || '').replace(/[^a-zA-Z\s]/g, ' ')
  if (!source) return 'S'

  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formBio, setFormBio] = useState('')
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recipeCount, setRecipeCount] = useState<number | null>(null)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [sharedRecipes, setSharedRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const displayName = useMemo(
    () => profile?.display_name || getFallbackUserName(user?.email),
    [profile, user?.email]
  )

  const username = useMemo(
    () =>
      profile?.username ||
      ((user?.user_metadata as Record<string, unknown>)?.username as string | undefined) ||
      null,
    [profile, user?.user_metadata]
  )

  const avatarUrl = useMemo(
    () =>
      ((user?.user_metadata as Record<string, unknown>)?.avatar_url as string | null) ||
      profile?.avatar_url ||
      null,
    [profile, user?.user_metadata]
  )

  const avatarInitials = useMemo(
    () => getAvatarInitials(displayName, user?.email),
    [displayName, user?.email]
  )

  useEffect(() => {
    const userId = user?.id?.trim()
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadProfile(currentUserId: string) {
      setLoading(true)
      setError(null)

      try {
        const [profileData, count, sharedRows] = await Promise.all([
          getProfileById(currentUserId),
          getRecipeCountByUserId(currentUserId),
          getPublicRecipesByUserId(currentUserId),
        ])

        if (profileData) {
          setProfile(profileData)
        }

        setRecipeCount(count)
        setSharedRecipes(
          sharedRows.map((row) => mapDbRowToRecipe(row, currentUserId))
        )
      } catch (err) {
        console.error('Failed to load profile page data:', err)
        setError('Unable to load profile information. Please try again later.')
        setRecipeCount(0)
        setSharedRecipes([])
      } finally {
        setLoading(false)
      }
    }

    const storedFavoriteRecipeIds = localStorage.getItem('favoriteRecipeIds')
    const favoriteIds = storedFavoriteRecipeIds
      ? (JSON.parse(storedFavoriteRecipeIds) as unknown)
      : []

    setFavoritesCount(Array.isArray(favoriteIds) ? favoriteIds.length : 0)
    void loadProfile(userId)
  }, [user])

  useEffect(() => {
    if (profile && !isEditing) {
      setFormDisplayName(profile.display_name ?? '')
      setFormBio(profile.bio ?? '')
    }
  }, [profile, isEditing])

  function handleStartEditing() {
    setFormDisplayName(profile?.display_name ?? '')
    setFormBio(profile?.bio ?? '')
    setEditAvatarFile(null)
    setIsEditing(true)
  }

  function handleCancelEditing() {
    setFormDisplayName(profile?.display_name ?? '')
    setFormBio(profile?.bio ?? '')
    setEditAvatarFile(null)
    setIsEditing(false)
  }

  async function handleSaveProfile() {
    const userId = user?.id?.trim()
    if (!userId) return

    setSavingProfile(true)
    try {
      let avatar_url = profile?.avatar_url ?? null

      if (editAvatarFile) {
        const { uploadProfileImage } = await import('../lib/storageService')
        avatar_url = await uploadProfileImage(userId, editAvatarFile)
      }

      const trimmedName = formDisplayName.trim()
      const trimmedBio = formBio.trim()

      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: trimmedName || null,
          bio: trimmedBio || null,
          avatar_url,
        })
        .eq('id', userId)
        .select('id, display_name, username, avatar_url, bio')
        .maybeSingle()

      if (error) {
        logSupabaseError('saveProfile', error)
        throw error
      }

      if (data) {
        setProfile(data as Profile)
      } else {
        setProfile((current) => ({
          id: userId,
          display_name: trimmedName || null,
          username: current?.username ?? null,
          avatar_url,
          bio: trimmedBio || null,
          deleted_at: current?.deleted_at ?? null,
        }))
      }

      setEditAvatarFile(null)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleDeleteAccount() {
    if (!user || deletingAccount) return

    const confirmed = window.confirm(
      'Delete your Savora account?\n\n' +
        'Your profile will be anonymized, your favorites and likes will be removed, ' +
        'and your shared recipes will be made private. This cannot be undone from the app.\n\n' +
        'Type OK to continue.'
    )
    if (!confirmed) return

    setDeletingAccount(true)
    setError(null)

    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account')
      if (rpcError) {
        logSupabaseError('delete_user_account', rpcError)
        throw rpcError
      }

      await logout()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Failed to delete account:', err)
      setError('Could not delete your account. Please try again or contact support.')
      setDeletingAccount(false)
    }
  }

  if (!user) {
    return (
      <section className="profile-page__state-screen">
        <p>Please sign in to view your profile.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="profile-page__state-screen">
        <p>Loading profile…</p>
      </section>
    )
  }

  return (
    <section className="profile-page">
      <div className="profile-page__layout">
        {/* ── Left column: avatar + info card ── */}
        <aside className="profile-page__sidebar">
          <div
            className={
              avatarUrl
                ? 'profile-page__avatar-wrapper'
                : 'profile-page__avatar-wrapper profile-page__avatar-wrapper--default'
            }
            aria-hidden={!avatarUrl}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
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
            {username ? (
              <p className="profile-page__handle">@{username}</p>
            ) : null}
            <h1 className="profile-page__display-name">{displayName}</h1>
            <p className="profile-page__email">{user.email}</p>

            {profile?.bio && !isEditing ? (
              <p className="profile-page__bio">{profile.bio}</p>
            ) : null}

            <div className="profile-page__edit-actions">
              {isEditing ? (
                <div className="profile-page__edit-form">
                  <label
                    className="profile-page__field-label"
                    htmlFor="profile-display-name"
                  >
                    Display name
                  </label>
                  <input
                    id="profile-display-name"
                    className="profile-page__input"
                    value={formDisplayName}
                    onChange={(event) => setFormDisplayName(event.target.value)}
                    placeholder="Display name"
                    disabled={savingProfile}
                  />

                  <label
                    className="profile-page__field-label"
                    htmlFor="profile-bio"
                  >
                    Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    className="profile-page__textarea"
                    value={formBio}
                    onChange={(event) => setFormBio(event.target.value)}
                    placeholder="Tell others about your cooking style"
                    rows={3}
                    maxLength={280}
                    disabled={savingProfile}
                  />

                  <label
                    className="profile-page__field-label"
                    htmlFor="profile-avatar"
                  >
                    Profile photo
                  </label>
                  <input
                    id="profile-avatar"
                    type="file"
                    accept="image/*"
                    className="profile-page__file-input"
                    onChange={(event) =>
                      setEditAvatarFile(event.target.files?.[0] ?? null)
                    }
                    disabled={savingProfile}
                  />

                  <div className="profile-page__edit-buttons">
                    <button
                      type="button"
                      className="profile-page__save-button"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="profile-page__cancel-button"
                      onClick={handleCancelEditing}
                      disabled={savingProfile}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="profile-page__edit-profile-button"
                  onClick={handleStartEditing}
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Right column: stats + recipes (stacked) ── */}
        <div className="profile-page__main">
          <div className="profile-page__stats-grid">
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Recipes</p>
              <p className="profile-page__stat-value">{recipeCount ?? 0}</p>
            </div>

            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Favorites</p>
              <p className="profile-page__stat-value">{favoritesCount}</p>
            </div>

            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Shared</p>
              <p className="profile-page__stat-value">{sharedRecipes.length}</p>
            </div>
          </div>

          <section className="profile-page__recipes-section">
            <div className="profile-page__recipes-header">
              <div>
                <p className="profile-page__stat-label">Shared recipes</p>
                <h2 className="profile-page__recipes-title">
                  Your public recipe collection
                </h2>
              </div>
              <p className="profile-page__recipes-hint">
                Share recipes publicly from the recipe form to add them here for
                the community to discover.
              </p>
            </div>

            {sharedRecipes.length === 0 ? (
              <div className="profile-page__empty">
                <p className="profile-page__empty-heading">
                  No shared recipes yet.
                </p>
                <p>
                  Create a recipe and choose to share it publicly to populate
                  your shared recipes list.
                </p>
              </div>
            ) : (
              <div className="profile-page__recipe-grid">
                {sharedRecipes.map((recipe) => (
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

          <section
            className="profile-page__danger-zone"
            aria-labelledby="profile-danger-zone-title"
          >
            <h3
              id="profile-danger-zone-title"
              className="profile-page__danger-title"
            >
              Danger zone
            </h3>
            <p className="profile-page__danger-description">
              Deleting your account anonymizes your profile, removes your
              favorites and likes, and makes your shared recipes private.
              Contact support for a full data erasure.
            </p>
            <button
              type="button"
              className="profile-page__danger-button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deleting…' : 'Delete account'}
            </button>
          </section>
        </div>
      </div>
    </section>
  )
}
