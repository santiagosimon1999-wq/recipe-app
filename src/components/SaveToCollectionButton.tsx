import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { notify } from '../lib/toast'
import {
  addRecipeToCollection,
  createCollection,
  getCollectionsContainingRecipe,
  getCollectionsForUser,
  type CollectionSummary,
} from '../services/collections'
import { getSupabaseRecipeId } from '../utils/favorites'
import type { Recipe } from '../types/Recipe'

const DEFAULT_COLLECTION_NAME = 'Saved recipes'

type SaveToCollectionButtonProps = {
  recipe: Recipe
  compact?: boolean
  onEnsureSaved?: (recipe: Recipe) => Promise<boolean>
}

export default function SaveToCollectionButton({
  recipe,
  compact = false,
  onEnsureSaved,
}: SaveToCollectionButtonProps) {
  const { user } = useAuth()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const recipeId = getSupabaseRecipeId(recipe)

  const loadCollections = useCallback(async () => {
    if (!user) return []
    const rows = await getCollectionsForUser(user.id)
    setCollections(rows)
    return rows
  }, [user])

  useEffect(() => {
    if (!user || recipeId === null) return
    let cancelled = false

    void (async () => {
      try {
        const rows = await getCollectionsForUser(user.id)
        if (!cancelled) {
          setCollections(rows)
        }
      } catch (error) {
        console.error('Save to collection failed:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, recipeId])

  const collectionsContainingRecipe = useMemo(() => {
    if (recipeId === null) return []
    return getCollectionsContainingRecipe(collections, recipeId)
  }, [collections, recipeId])

  const inCollection = collectionsContainingRecipe.length > 0

  if (!user || recipeId === null || recipe.source === 'sample') {
    return null
  }

  async function persistToCollection(
    collectionId: string,
    collectionName: string,
  ) {
    if (!user || recipeId === null) return

    const alreadyInList = collections.some(
      (collection) =>
        collection.id === collectionId &&
        collection.recipeIds.includes(recipeId),
    )

    if (alreadyInList) {
      notify.success(`Already in “${collectionName}”.`)
      setOpen(false)
      return
    }

    if (onEnsureSaved) {
      const saved = await onEnsureSaved(recipe)
      if (!saved) return
    }

    await addRecipeToCollection(user.id, collectionId, recipeId)
    notify.success(`Saved and added to “${collectionName}”.`)
    setOpen(false)
    await loadCollections()
  }

  async function handleSaveClick() {
    if (!user || recipeId === null || busy) return

    if (open) {
      setOpen(false)
      return
    }

    setBusy(true)
    try {
      const rows = await loadCollections()
      const containing = getCollectionsContainingRecipe(rows, recipeId)

      if (rows.length === 0) {
        const created = await createCollection(user.id, DEFAULT_COLLECTION_NAME)
        await persistToCollection(created.id, created.name)
        return
      }

      if (rows.length === 1) {
        if (containing.length > 0) {
          notify.success(`Already in “${rows[0].name}”.`)
          return
        }
        await persistToCollection(rows[0].id, rows[0].name)
        return
      }

      setOpen(true)
    } catch (error) {
      console.error('Save to collection failed:', error)
      notify.error('Could not add to your collection. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePickCollection(collectionId: string, name: string) {
    if (busy) return

    setBusy(true)
    try {
      await persistToCollection(collectionId, name)
    } catch (error) {
      console.error('Save to collection failed:', error)
      notify.error('Could not add to that collection.')
    } finally {
      setBusy(false)
    }
  }

  const collectionLabel = compact
    ? inCollection
      ? collectionsContainingRecipe.length > 1
        ? `${collectionsContainingRecipe.length} folders`
        : 'In folder'
      : 'Organize'
    : inCollection
      ? collectionsContainingRecipe.length === 1
        ? `In · ${collectionsContainingRecipe[0].name}`
        : `In ${collectionsContainingRecipe.length} collections`
      : 'Add to collection'

  const buttonLabel = busy ? 'Adding…' : collectionLabel

  return (
    <div
      className={
        compact ? 'save-to-collection save-to-collection--compact' : 'save-to-collection'
      }
    >
      <button
        type="button"
        className={[
          'recipe-modal__edit-button',
          'save-to-collection__toggle',
          compact ? 'recipe-modal__sticky-action' : '',
          inCollection ? 'save-to-collection__toggle--saved' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => void handleSaveClick()}
        aria-expanded={open}
        aria-pressed={inCollection}
        aria-haspopup={collections.length > 1 ? 'menu' : undefined}
        disabled={busy}
        aria-label={
          inCollection
            ? `In ${collectionsContainingRecipe.length} collection${collectionsContainingRecipe.length === 1 ? '' : 's'}`
            : 'Add to collection'
        }
      >
        {inCollection ? (
          <BookmarkCheck size={16} aria-hidden="true" />
        ) : (
          <Bookmark size={16} aria-hidden="true" />
        )}
        {buttonLabel}
      </button>
      {compact ? null : (
        <p className="save-to-collection__hint">
          Organize saved recipes into collections like Weeknight dinners or High
          protein.
        </p>
      )}

      {open && collections.length > 1 ? (
        <div className="save-to-collection__menu" role="menu">
          {collections.map((collection) => {
            const inList = collection.recipeIds.includes(recipeId)

            return (
              <button
                key={collection.id}
                type="button"
                className={
                  inList
                    ? 'save-to-collection__option save-to-collection__option--saved'
                    : 'save-to-collection__option'
                }
                onClick={() =>
                  void handlePickCollection(collection.id, collection.name)
                }
                disabled={busy}
                role="menuitem"
              >
                <span>{collection.name}</span>
                {inList ? (
                  <span className="save-to-collection__badge">Added</span>
                ) : collection.recipeCount > 0 ? (
                  <span className="save-to-collection__count">
                    {collection.recipeCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
