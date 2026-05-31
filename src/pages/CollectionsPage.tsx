import { useCallback, useEffect, useState } from 'react'
import { FolderPlus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
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
  onSelectRecipe: (recipe: Recipe) => void
}

export default function CollectionsPage({ onSelectRecipe }: CollectionsPageProps) {
  const { user } = useAuth()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  const loadCollections = useCallback(async () => {
    if (!user) return

    const rows = await getCollectionsForUser(user.id)
    setCollections(rows)

    if (!selectedId && rows.length > 0) {
      setSelectedId(rows[0].id)
    }
  }, [user, selectedId])

  useEffect(() => {
    if (!user) {
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
  }, [user, loadCollections])

  useEffect(() => {
    if (!user || !selectedId) {
      Promise.resolve().then(() => {
        setRecipes([])
      })
      return
    }

    void (async () => {
      setLoadingRecipes(true)
      try {
        const rows = await getCollectionRecipeRows(user.id, selectedId)
        setRecipes(rows.map((row) => mapDbRowToRecipe(row, user.id)))
      } catch (error) {
        console.error('Failed to load collection recipes:', error)
        setRecipes([])
      } finally {
        setLoadingRecipes(false)
      }
    })()
  }, [user, selectedId])

  async function handleCreateCollection() {
    if (!user || busy) return

    setBusy(true)
    try {
      const created = await createCollection(user.id, newName)
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
    if (!user || busy) return

    setBusy(true)
    try {
      await deleteCollection(user.id, collectionId)
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

  if (!user) {
    return (
      <section className="profile-page__state-screen">
        <p>Sign in to organize recipes into collections.</p>
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
          <h1 className="profile-page__display-name">My collections</h1>
          <p className="profile-page__bio">
            Group saved inspiration into themed cookbooks.
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
                emptyBody="Save recipes to this collection from a recipe modal."
              />
            )
          ) : (
            <div className="profile-page__empty">
              <p className="profile-page__empty-heading">No collections yet.</p>
              <p>Create your first collection to get started.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
