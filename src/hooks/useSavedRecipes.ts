import { useCallback, useEffect, useState } from 'react'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
import {
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
  getSavedRecipesForUser,
} from '../lib/recipeService'
import type { Recipe } from '../types/Recipe'

type UseSavedRecipesParams = {
  userId?: string
  cloudSavedRecipeIds: number[]
  onMergeLikeCounts?: (likeCounts: Record<number, number>) => void
  onMergeLikedRecipeIds?: (recipeIds: number[]) => void
}

type UseSavedRecipesResult = {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  retry: () => void
}

export function useSavedRecipes({
  userId,
  cloudSavedRecipeIds,
  onMergeLikeCounts,
  onMergeLikedRecipeIds,
}: UseSavedRecipesParams): UseSavedRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (!userId) {
      Promise.resolve().then(() => {
        if (cancelled) return
        setRecipes([])
        setLoading(false)
        setError(null)
      })

      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setLoading(true)
      setError(null)

      try {
        const rows = await getSavedRecipesForUser(userId)
        if (cancelled) return

        const mapped = rows.map((row) => mapDbRowToRecipe(row, userId))
        const recipeIds = mapped
          .map((recipe) => recipe.id)
          .filter((id) => Number.isFinite(id) && id > 0)

        const [likeCounts, likedIds] =
          recipeIds.length > 0
            ? await Promise.all([
                getLikesCountsForRecipeIds(recipeIds),
                getLikedRecipeIdsByUser(userId),
              ])
            : [{}, [] as number[]]

        if (cancelled) return

        onMergeLikeCounts?.(likeCounts)
        onMergeLikedRecipeIds?.(likedIds)

        setRecipes(
          mapped.map((recipe) => ({
            ...recipe,
            likeCount: likeCounts[recipe.id] ?? 0,
            liked: likedIds.includes(recipe.id),
          }))
        )
      } catch (fetchError) {
        console.error('Failed to load saved recipes:', fetchError)
        if (!cancelled) {
          setError('Could not load your saved recipes right now.')
          setRecipes([])
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
  }, [
    userId,
    cloudSavedRecipeIds,
    refreshTick,
    onMergeLikeCounts,
    onMergeLikedRecipeIds,
  ])

  const retry = useCallback(() => {
    setRefreshTick((tick) => tick + 1)
  }, [])

  return { recipes, loading, error, retry }
}
