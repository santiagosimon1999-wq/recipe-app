import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useConfirm } from '../context/ConfirmProvider'
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
  removeRecipeFromCollection,
  renameCollection,
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

function formatRecipeCount(count: number): string {
  return count === 1 ? '1 recipe' : `${count} recipes`
}

export default function CollectionsPage({
  userId,
  onSelectRecipe,
  onMergeLikeCounts,
  onMergeLikedRecipeIds,
}: CollectionsPageProps) {
  const { user } = useAuth()
  const confirm = useConfirm()
  const activeUserId = userId ?? user?.id
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [renameError, setRenameError] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const selectedCollection = collections.find(
    (collection) => collection.id === selectedId,
  )

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

  useEffect(() => {
    if (!renamingId) return

    const frameId = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [renamingId])

  function handleStartRename(collection: CollectionSummary) {
    if (busy) return

    setRenamingId(collection.id)
    setRenameDraft(collection.name)
    setRenameError('')
  }

  function handleCancelRename() {
    setRenamingId(null)
    setRenameDraft('')
    setRenameError('')
  }

  async function handleSaveRename(collectionId: string) {
    if (!activeUserId || busy) return

    const trimmed = renameDraft.trim()
    if (!trimmed) {
      setRenameError('Collection name is required.')
      return
    }

    const existing = collections.find((collection) => collection.id === collectionId)
    if (existing && trimmed === existing.name) {
      handleCancelRename()
      return
    }

    setBusy(true)
    setRenameError('')

    try {
      const updated = await renameCollection(activeUserId, collectionId, trimmed)
      setCollections((current) =>
        current.map((collection) =>
          collection.id === collectionId
            ? { ...collection, name: updated.name }
            : collection
        )
      )
      handleCancelRename()
      notify.success('Collection renamed.')
    } catch (error) {
      console.error('Rename collection failed:', error)
      notify.error(
        error instanceof Error ? error.message : 'Could not rename collection.'
      )
    } finally {
      setBusy(false)
    }
  }

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

  async function handleDeleteCollection(collection: CollectionSummary) {
    if (!activeUserId || busy) return

    const confirmed = await confirm({
      title: `Delete “${collection.name}”?`,
      message:
        'Recipes stay in your saved cookbook. Only this collection folder and its organization are removed.',
      confirmLabel: 'Delete collection',
      cancelLabel: 'Keep collection',
      variant: 'danger',
    })

    if (!confirmed) return

    setBusy(true)
    try {
      await deleteCollection(activeUserId, collection.id)
      setCollections((current) => {
        const next = current.filter((item) => item.id !== collection.id)
        if (selectedId === collection.id) {
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

  async function handleRemoveRecipe(recipe: Recipe) {
    if (!activeUserId || !selectedId || busy) return

    setBusy(true)
    try {
      await removeRecipeFromCollection(activeUserId, selectedId, recipe.id)
      setRecipes((current) => current.filter((item) => item.id !== recipe.id))
      setCollections((current) =>
        current.map((collection) => {
          if (collection.id !== selectedId) return collection

          const recipeIds = collection.recipeIds.filter((id) => id !== recipe.id)
          return {
            ...collection,
            recipeIds,
            recipeCount: recipeIds.length,
          }
        })
      )
      notify.success('Removed from collection.')
    } catch (error) {
      console.error('Remove recipe from collection failed:', error)
      notify.error('Could not remove recipe from collection.')
    } finally {
      setBusy(false)
    }
  }

  if (!activeUserId) {
    return (
      <section className="profile-page__state-screen">
        <p>Sign in to organize saved recipes into collections.</p>
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
          <p className="app-eyebrow">Organize saved recipes</p>
          <h1 className="profile-page__display-name">Collections</h1>
          <p className="community-feed__intro" data-testid="collections-page-intro">
            Use collections to organize saved recipes into folders like Weeknight
            dinners, High protein, or Desserts. Save a recipe first, then add it
            to a collection from the recipe view.
          </p>
          <p className="profile-page__recipes-hint">
            <Link to="/saved">View your saved cookbook</Link>
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
              aria-label="New collection name"
            />
            <button
              type="submit"
              className="profile-page__edit-profile-button"
              disabled={busy || !newName.trim()}
            >
              <FolderPlus size={16} aria-hidden="true" />
              Create collection
            </button>
          </form>

          <ul className="collections-page__list">
            {collections.map((collection) => (
              <li
                key={collection.id}
                className={
                  renamingId === collection.id
                    ? 'collections-page__list-item collections-page__list-item--editing'
                    : 'collections-page__list-item'
                }
              >
                {renamingId === collection.id ? (
                  <form
                    className="collections-page__rename-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void handleSaveRename(collection.id)
                    }}
                  >
                    <label
                      className="collections-page__rename-label"
                      htmlFor={`rename-collection-${collection.id}`}
                    >
                      Rename {collection.name} collection
                    </label>
                    <input
                      ref={renameInputRef}
                      id={`rename-collection-${collection.id}`}
                      type="text"
                      className="collections-page__rename-input"
                      value={renameDraft}
                      onChange={(event) => {
                        setRenameDraft(event.target.value)
                        if (renameError) setRenameError('')
                      }}
                      maxLength={80}
                      disabled={busy}
                      aria-invalid={Boolean(renameError)}
                      aria-describedby={
                        renameError
                          ? `rename-collection-error-${collection.id}`
                          : undefined
                      }
                    />
                    {renameError ? (
                      <p
                        id={`rename-collection-error-${collection.id}`}
                        className="collections-page__rename-error"
                        role="alert"
                      >
                        {renameError}
                      </p>
                    ) : null}
                    <div className="collections-page__rename-actions">
                      <button
                        type="submit"
                        className="collections-page__rename-save"
                        disabled={busy}
                        aria-busy={busy}
                      >
                        {busy ? 'Saving…' : 'Save name'}
                      </button>
                      <button
                        type="button"
                        className="collections-page__rename-cancel"
                        onClick={handleCancelRename}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`collections-page__list-button ${
                        selectedId === collection.id
                          ? 'collections-page__list-button--active'
                          : ''
                      }`}
                      onClick={() => setSelectedId(collection.id)}
                      aria-label={`View ${collection.name} collection, ${formatRecipeCount(collection.recipeCount)}`}
                    >
                      <span className="collections-page__list-label">
                        <span>{collection.name}</span>
                        <span className="collections-page__view-label">
                          View collection
                        </span>
                      </span>
                      <span className="collections-page__count">
                        {formatRecipeCount(collection.recipeCount)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="collections-page__rename"
                      aria-label={`Rename ${collection.name} collection`}
                      onClick={() => handleStartRename(collection)}
                      disabled={busy}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="collections-page__delete"
                      aria-label={`Delete ${collection.name} collection`}
                      onClick={() => void handleDeleteCollection(collection)}
                      disabled={busy}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <div className="profile-page__main">
          {selectedId && selectedCollection ? (
            loadingRecipes ? (
              <ProfilePageSkeleton />
            ) : (
              <>
                <div className="collections-page__detail-header">
                  <h2 className="profile-page__recipes-title">
                    {selectedCollection.name}
                  </h2>
                  <p className="profile-page__recipes-hint">
                    {formatRecipeCount(selectedCollection.recipeCount)} · Organize
                    saved recipes
                  </p>
                </div>
                <ProfileRecipeGrid
                  recipes={recipes}
                  onSelectRecipe={onSelectRecipe}
                  onRemoveRecipe={handleRemoveRecipe}
                  emptyHeading="No recipes in this collection yet."
                  emptyBody="Save a recipe, then use Add to collection from the recipe modal to file it here."
                />
              </>
            )
          ) : (
            <div className="profile-page__empty" data-testid="collections-empty-state">
              <p className="profile-page__empty-heading">No collections yet.</p>
              <p>
                Collections are folders for organizing saved recipes. Create one
                like Weeknight dinners or Desserts, then add saved recipes from
                any recipe view.
              </p>
              <p className="profile-page__recipes-hint">
                <Link to="/saved">Go to your saved cookbook</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
