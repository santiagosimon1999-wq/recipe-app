import { useCallback, useEffect, useState } from 'react'
import { FolderPlus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
import {
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
} from '../lib/recipeService'
import { notify } from '../lib/toast'
import {
  createCollection,
  deleteCollection,
  getCollectionRecipeRows,
  getCollectionsForUser,
  type CollectionSummary,
} from '../services/collections'
import type { Recipe } from '../types/Recipe'
import ProfileRecipeGrid from '../components/ProfileRecipeGrid'
import { ProfilePageSkeleton } from '../components/ui/ProfilePageSkeleton'

type CollectionsPageProps = {
  userId?: string
  onSelectRecipe: (recipe: Recipe) => void
  onMergeLikeCounts?: (likeCounts: Record<number, number>) => void
  onMergeLikedRecipeIds?: (recipeIds: number[]) => void
}

export default function CollectionsPage({
  userId,
  onSelectRecipe,
  onMergeLikeCounts,
  onMergeLikedRecipeIds,
}: CollectionsPageProps) {
  const { user } = useAuth()
  const activeUserId = userId ?? user?.id
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  const loadCollections = useCallback(async () => {
    if (!activeUserId) return

    const rows = await getCollectionsForUser(activeUserId)
    setCollections(rows)

    if (!selectedId && rows.length > 0) {
      setSelectedId(rows[0].id)
    }
  }, [activeUserId, selectedId])

  useEffect(() => {
    if (!activeUserId) {
      Promise.resolve().then(() => {
        setLoading(false)
      })
      return
    }

    void (async () => {
      setLoading(true)
      try {
        await loadCollections()
      } catch (error) {
        console.error('Failed to load collections:', error)
        notify.error('Could not load collections.')
      } finally {
        setLoading(false)
      }
    })()
  }, [activeUserId, loadCollections])

  useEffect(() => {
    if (!activeUserId || !selectedId) {
      Promise.resolve().then(() => {
        setRecipes([])
      })
      return
    }

    void (async () => {
      setLoadingRecipes(true)
      try {
        const rows = await getCollectionRecipeRows(activeUserId, selectedId)
        const mappedRecipes = rows.map((row) => mapDbRowToRecipe(row, activeUserId))
        const recipeIds = mappedRecipes.map((recipe) => recipe.id).filter((id) => id > 0)
        const [likeCounts, likedIds] =
          recipeIds.length > 0
            ? await Promise.all([
                getLikesCountsForRecipeIds(recipeIds),
                getLikedRecipeIdsByUser(activeUserId),
              ])
            : [{}, [] as number[]]

        onMergeLikeCounts?.(likeCounts)
        onMergeLikedRecipeIds?.(likedIds)
        setRecipes(
          mappedRecipes.map((recipe) => ({
            ...recipe,
            likeCount: likeCounts[recipe.id] ?? 0,
            liked: likedIds.includes(recipe.id),
          }))
        )
      } catch (error) {
        console.error('Failed to load collection recipes:', error)
        setRecipes([])
      } finally {
        setLoadingRecipes(false)
      }
    })()
  }, [
    activeUserId,
    selectedId,
    onMergeLikeCounts,
    onMergeLikedRecipeIds,
  ])

  async function handleCreateCollection() {
    if (!activeUserId || busy) return

    setBusy(true)
    try {
      const created = await createCollection(activeUserId, newName)
      setNewName('')
      setCollections((current) => [created, ...current])
      setSelectedId(created.id)
      notify.success('Collection created.')
    } catch (error) {
      console.error('Create collection failed:', error)
      notify.error(
        error instanceof Error ? error.message : 'Could not create collection.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteCollection(collectionId: string) {
    if (!activeUserId || busy) return

    setBusy(true)
    try {
      await deleteCollection(activeUserId, collectionId)
      setCollections((current) => {
        const next = current.filter((item) => item.id !== collectionId)
        if (selectedId === collectionId) {
          setSelectedId(next[0]?.id ?? null)
        }
        return next
      })
      notify.success('Collection deleted.')
    } catch (error) {
      console.error('Delete collection failed:', error)
      notify.error('Could not delete collection.')
    } finally {
      setBusy(false)
    }
  }

  if (!activeUserId) {
    return (
      <section className="profile-page__state-screen">
        <p>Sign in to save recipes and organize them into collections.</p>
      </section>
    )
  }

  if (loading) {
    return <ProfilePageSkeleton />
  }

  return (
    <section className="collections-page profile-page">
      <div className="profile-page__layout collections-page__layout">
        <aside className="collections-page__sidebar">
          <h1 className="profile-page__display-name">Collections</h1>
          <p className="profile-page__bio">
            Organize your saved recipes into collections.
          </p>
          <p className="profile-page__recipes-hint">
            Collections help organize recipes you have already saved.
          </p>

          <form
            className="collections-page__create-form"
            onSubmit={(event) => {
              event.preventDefault()
              void handleCreateCollection()
            }}
          >
            <input
              type="text"
              className="collections-page__input"
              placeholder="New collection name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={80}
            />
            <button
              type="submit"
              className="profile-page__edit-profile-button"
              disabled={busy || !newName.trim()}
            >
              <FolderPlus size={16} aria-hidden="true" />
              Create
            </button>
          </form>

          <ul className="collections-page__list">
            {collections.map((collection) => (
              <li key={collection.id}>
                <button
                  type="button"
                  className={`collections-page__list-button ${
                    selectedId === collection.id
                      ? 'collections-page__list-button--active'
                      : ''
                  }`}
                  onClick={() => setSelectedId(collection.id)}
                >
                  <span>{collection.name}</span>
                  <span className="collections-page__count">
                    {collection.recipeCount}
                  </span>
                </button>
                <button
                  type="button"
                  className="collections-page__delete"
                  aria-label={`Delete ${collection.name}`}
                  onClick={() => void handleDeleteCollection(collection.id)}
                  disabled={busy}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="profile-page__main">
          {selectedId ? (
            loadingRecipes ? (
              <ProfilePageSkeleton />
            ) : (
              <ProfileRecipeGrid
                recipes={recipes}
                onSelectRecipe={onSelectRecipe}
                emptyHeading="This collection is empty."
                emptyBody="Add saved recipes to this collection from the recipe modal."
              />
            )
          ) : (
            <div className="profile-page__empty">
              <p className="profile-page__empty-heading">No collections yet.</p>
              <p>Collections are optional folders for your saved recipes.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
