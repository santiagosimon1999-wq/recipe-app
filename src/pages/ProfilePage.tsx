import { useEffect, useMemo, useState } from 'react'
import type { Recipe } from '../types/Recipe'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

type Profile = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url?: string | null
}

type DbRecipeRow = {
  id: number
  user_id: string
  title: string
  image_url: string | null
  description: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string
  author_name?: string | null
  is_public?: boolean | null
  created_at?: string | null
}

function getFallbackUserName(email: string | null | undefined) {
  if (!email) return 'Panda'
  return email.split('@')[0]
}

function mapRecipeRow(row: DbRecipeRow): Recipe {
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
    source: 'user',
    userId: row.user_id,
    authorName: row.author_name ?? 'You',
    isPublic: row.is_public ?? false,
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recipeCount, setRecipeCount] = useState<number | null>(null)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [sharedRecipes, setSharedRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(
    () => profile?.display_name || getFallbackUserName(user?.email),
    [profile, user?.email]
  )

  const username = useMemo(
    () =>
      profile?.username ||
      (user?.user_metadata as any)?.username ||
      getFallbackUserName(user?.email),
    [profile, user?.user_metadata, user?.email]
  )

  const avatarUrl = useMemo(
    () =>
      (user?.user_metadata as any)?.avatar_url ||
      profile?.avatar_url ||
      null,
    [profile, user?.user_metadata]
  )

  useEffect(() => {
    if (!user) return

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const { data: profileData, error: profileError } = await supabase
          .from<Profile>('profiles')
          .select('id, display_name, username, avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (profileData) {
          setProfile(profileData)
        }

        const countPromise = supabase
          .from('recipes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        const sharedPromise = supabase
          .from<DbRecipeRow>('recipes')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        const [countResult, sharedResult] = await Promise.all([
          countPromise,
          sharedPromise,
        ])

        if (countResult.error) {
          throw countResult.error
        }

        setRecipeCount(countResult.count ?? 0)

        if (sharedResult.error) {
          throw sharedResult.error
        }

        setSharedRecipes((sharedResult.data ?? []).map(mapRecipeRow))
      } catch (err) {
        console.error('Failed to load profile page data:', err)
        setError('Unable to load profile information. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    const storedFavoriteRecipeIds = localStorage.getItem('favoriteRecipeIds')
    const favoriteIds = storedFavoriteRecipeIds
      ? JSON.parse(storedFavoriteRecipeIds)
      : []

    setFavoritesCount(Array.isArray(favoriteIds) ? favoriteIds.length : 0)
    void loadProfile()
  }, [user])

  if (!user) {
    return (
      <section style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please sign in to view your profile.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading profile…</p>
      </section>
    )
  }

  return (
    <section
      style={{
        maxWidth: 980,
        margin: '0 auto',
        padding: '2rem 1rem 3rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'minmax(180px, 250px) 1fr',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontSize: '3rem',
                  color: '#374151',
                  fontWeight: 900,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div
            style={{
              padding: '1.25rem',
              borderRadius: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#6b7280',
              }}
            >
              @{username}
            </p>
            <h1
              style={{
                margin: '0.5rem 0 0',
                fontSize: '2rem',
                lineHeight: 1.1,
              }}
            >
              {displayName}
            </h1>
            <p style={{ margin: '0.75rem 0 0', color: '#4b5563' }}>
              {user.email}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          }}
        >
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              Recipes
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              {recipeCount ?? 0}
            </p>
          </div>

          <div
            style={{
              padding: '1.25rem',
              borderRadius: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              Favorites
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              {favoritesCount}
            </p>
          </div>

          <div
            style={{
              padding: '1.25rem',
              borderRadius: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              Shared recipes
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              {sharedRecipes.length}
            </p>
          </div>
        </div>
      </div>

      <section
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          borderRadius: '1.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              Shared recipes
            </p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.75rem' }}>
              Your public recipe collection
            </h2>
          </div>

          <div style={{ minWidth: 220, color: '#4b5563' }}>
            Share recipes publicly from the recipe form to add them here for the community to discover.
          </div>
        </div>

        {sharedRecipes.length === 0 ? (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              borderRadius: '1.25rem',
              border: '1px dashed #e5e7eb',
              backgroundColor: '#f9fafb',
              color: '#6b7280',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>No shared recipes yet.</p>
            <p style={{ margin: '0.75rem 0 0' }}>
              Create a recipe and choose to share it publicly to populate your shared recipes list.
            </p>
          </div>
        ) : (
          <div
            style={{
              marginTop: '1.5rem',
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            {sharedRecipes.map((recipe) => (
              <article
                key={recipe.id}
                style={{
                  borderRadius: '1.25rem',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ width: '100%', height: 180, overflow: 'hidden' }}>
                  <img
                    src={
                      recipe.image ||
                      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={recipe.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '1rem' }}>
                  <p
                    style={{
                      margin: 0,
                      color: '#6b7280',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginBottom: '0.65rem',
                    }}
                  >
                    {recipe.category}
                  </p>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{recipe.title}</h3>
                  <p
                    style={{
                      margin: '0.75rem 0 0',
                      color: '#475569',
                      lineHeight: 1.6,
                      minHeight: 72,
                    }}
                  >
                    {recipe.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {error ? (
        <p style={{ marginTop: '1.5rem', color: '#b91c1c' }}>{error}</p>
      ) : null}
    </section>
  )
}
