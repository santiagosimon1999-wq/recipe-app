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
import {
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
} from '../lib/recipeService'

type PublicProfilePageProps = {
  userId?: string
  onSelectRecipe: (recipe: Recipe) => void
  onMergeLikeCounts?: (likeCounts: Record<number, number>) => void
  onMergeLikedRecipeIds?: (recipeIds: number[]) => void
}

export default function PublicProfilePage({
  userId,
  onSelectRecipe,
  onMergeLikeCounts,
  onMergeLikedRecipeIds,
}: PublicProfilePageProps) {
  const params = useParams<{ username: string }>()
  const navigate = useNavigate()
  const username = params.username ?? ''

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipeCreatedAtById, setRecipeCreatedAtById] = useState<
    Record<number, string>
  >({})
  const [followCounts, setFollowCounts] = useState<FollowCounts>({
    followers: 0,
    following: 0,
  })
  const [totalLikesReceived, setTotalLikesReceived] = useState(0)
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

  const joinedDateLabel = (() => {
    if (!profile?.created_at) {
      return 'Recently joined Savora'
    }

    const joinedDate = new Date(profile.created_at)
    if (Number.isNaN(joinedDate.getTime())) {
      return 'Joined Savora'
    }

    return `Joined ${joinedDate.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })}`
  })()

  const topRecipes = useMemo(() => {
    const recipesByLikes = [...recipes].sort((a, b) => {
      const likeDelta = (b.likeCount ?? 0) - (a.likeCount ?? 0)
      if (likeDelta !== 0) return likeDelta

      const aCreatedAt = recipeCreatedAtById[a.id]
      const bCreatedAt = recipeCreatedAtById[b.id]
      const aTime = aCreatedAt ? Date.parse(aCreatedAt) : Number.NaN
      const bTime = bCreatedAt ? Date.parse(bCreatedAt) : Number.NaN

      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
        return bTime - aTime
      }

      return b.id - a.id
    })

    return recipesByLikes.slice(0, 4)
  }, [recipes, recipeCreatedAtById])

  const recentRecipes = useMemo(() => {
    const topIds = new Set(topRecipes.map((recipe) => recipe.id))
    const withoutTop = recipes.filter((recipe) => !topIds.has(recipe.id))
    const candidates = withoutTop.length > 0 ? withoutTop : recipes
    return candidates.slice(0, 8)
  }, [recipes, topRecipes])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)
      setError(null)
      setRecipes([])
      setRecipeCreatedAtById({})
      setTotalLikesReceived(0)

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

        const mappedRecipes = publicRows.map((row) => mapDbRowToRecipe(row))
        const recipeIds = mappedRecipes
          .map((recipe) => recipe.id)
          .filter((id) => Number.isFinite(id) && id > 0)

        const [likeCounts, likedIds] =
          recipeIds.length > 0
            ? await Promise.all([
                getLikesCountsForRecipeIds(recipeIds),
                userId
                  ? getLikedRecipeIdsByUser(userId)
                  : Promise.resolve([] as number[]),
              ])
            : [{}, [] as number[]]

        onMergeLikeCounts?.(likeCounts)
        onMergeLikedRecipeIds?.(likedIds)

        const publicRecipes = mappedRecipes.map((recipe) => ({
          ...recipe,
          likeCount: likeCounts[recipe.id] ?? 0,
          liked: likedIds.includes(recipe.id),
        }))

        const totalLikes = publicRecipes.reduce(
          (sum, recipe) => sum + (recipe.likeCount ?? 0),
          0
        )

        const createdAtMap: Record<number, string> = {}
        for (const row of publicRows) {
          const rowId = Number(row.id)
          if (Number.isFinite(rowId) && rowId > 0) {
            createdAtMap[rowId] = row.created_at
          }
        }

        setRecipes(publicRecipes)
        setRecipeCreatedAtById(createdAtMap)
        setTotalLikesReceived(totalLikes)
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
  }, [username, userId, onMergeLikeCounts, onMergeLikedRecipeIds])

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
        <div className="profile-page__main">
          <section className="profile-page__recipes-section">
            <div className="profile-page__layout">
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

              <div className="profile-page__main">
                <div className="profile-page__info-card">
                  {profile.username ? (
                    <p className="profile-page__handle">@{profile.username}</p>
                  ) : null}
                  <h1 className="profile-page__display-name">{displayName}</h1>
                  <p className="profile-page__stat-label">{joinedDateLabel}</p>

                  {profile.bio ? (
                    <p className="profile-page__bio">{profile.bio}</p>
                  ) : (
                    <p className="profile-page__email">
                      This chef has not added a bio yet.
                    </p>
                  )}

                  <FollowButton
                    targetUserId={profile.id}
                    targetDisplayName={displayName}
                    className="public-profile__follow-button"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="profile-page__stats-grid">
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Followers</p>
              <p className="profile-page__stat-value">{followCounts.followers}</p>
            </div>
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Following</p>
              <p className="profile-page__stat-value">{followCounts.following}</p>
            </div>
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Public recipes</p>
              <p className="profile-page__stat-value">{recipes.length}</p>
            </div>
            <div className="profile-page__stat-card">
              <p className="profile-page__stat-label">Likes received</p>
              <p className="profile-page__stat-value">{totalLikesReceived}</p>
            </div>
          </div>

          {recipes.length === 0 ? (
            <section className="profile-page__recipes-section">
              <div className="profile-page__recipes-header">
                <div>
                  <p className="profile-page__stat-label">Recipes</p>
                  <h2 className="profile-page__recipes-title">
                    No public recipes yet
                  </h2>
                </div>
              </div>

              <div className="profile-page__empty">
                <p className="profile-page__empty-heading">
                  {displayName} has not shared any recipes yet.
                </p>
                <p>
                  Follow this chef to be notified when their first public recipes
                  are posted.
                </p>
              </div>
            </section>
          ) : (
            <>
              <section className="profile-page__recipes-section">
                <div className="profile-page__recipes-header">
                  <div>
                    <p className="profile-page__stat-label">Top recipes</p>
                    <h2 className="profile-page__recipes-title">
                      Most liked by the community
                    </h2>
                  </div>
                </div>

                <ProfileRecipeGrid
                  recipes={topRecipes}
                  onSelectRecipe={onSelectRecipe}
                  emptyHeading="No top recipes yet."
                  emptyBody="Once recipes receive likes, top recipes will appear here."
                />
              </section>

              <section className="profile-page__recipes-section">
                <div className="profile-page__recipes-header">
                  <div>
                    <p className="profile-page__stat-label">Recent recipes</p>
                    <h2 className="profile-page__recipes-title">
                      Latest public dishes from {displayName}
                    </h2>
                  </div>
                </div>

                <ProfileRecipeGrid
                  recipes={recentRecipes}
                  onSelectRecipe={onSelectRecipe}
                  emptyHeading="No recent recipes yet."
                  emptyBody="New public recipes will appear here."
                />
              </section>
            </>
          )}

          {error ? <p className="profile-page__error">{error}</p> : null}
        </div>
      </div>
    </section>
  )
}
