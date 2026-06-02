import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Recipe } from '../types/Recipe'
import {
  getSavedRecipeIdsByUser,
  saveRecipeForUser,
  unsaveRecipeForUser,
} from '../lib/recipeService'
import { notify } from '../lib/toast'
import {
  getRecipeListKey,
  getSupabaseRecipeId,
  isSampleRecipe,
} from '../utils/favorites'

export function useSaved(user: User | null, recipeList: Recipe[]) {
  const [cloudSavedRecipeIds, setCloudSavedRecipeIds] = useState<number[]>([])
  const [sampleSavedRecipeIds, setSampleSavedRecipeIds] = useState<number[]>(() => {
    try {
      const stored =
        localStorage.getItem('savedSampleRecipeIds') ??
        localStorage.getItem('favoriteSampleRecipeIds')
      return stored ? (JSON.parse(stored) as number[]) : []
    } catch (err) {
      console.error('Failed to load sample saved recipes from localStorage:', err)
      return []
    }
  })

  const savedFetchVersionRef = useRef(0)

  useEffect(() => {
    const fetchVersion = savedFetchVersionRef.current + 1
    savedFetchVersionRef.current = fetchVersion

    if (!user) {
      Promise.resolve().then(() => {
        if (fetchVersion !== savedFetchVersionRef.current) return
        setCloudSavedRecipeIds([])
      })
      return
    }

    const userId = user.id

    async function loadCloudSavedRecipeIds() {
      try {
        const savedIds = await getSavedRecipeIdsByUser(userId)
        if (fetchVersion !== savedFetchVersionRef.current) return
        setCloudSavedRecipeIds(savedIds)
      } catch (err) {
        console.error('Failed to load saved recipes from Supabase:', err)
        if (fetchVersion !== savedFetchVersionRef.current) return
        setCloudSavedRecipeIds([])
      }
    }

    void loadCloudSavedRecipeIds()
  }, [user])

  useEffect(() => {
    const serialized = JSON.stringify([
      ...cloudSavedRecipeIds.map((id) => `db:${id}`),
      ...sampleSavedRecipeIds.map((id) => `sample:${id}`),
    ])
    localStorage.setItem('savedRecipeIds', serialized)
    localStorage.setItem('favoriteRecipeIds', serialized)
  }, [cloudSavedRecipeIds, sampleSavedRecipeIds])

  const refreshCloudSavedRecipeIds = useCallback(
    async (userId: string) => {
      if (!user || userId !== user.id) {
        console.error(
          'refreshCloudSavedRecipeIds called with mismatched user id:',
          userId
        )
        return
      }

      const fetchVersion = savedFetchVersionRef.current + 1
      savedFetchVersionRef.current = fetchVersion

      try {
        const savedIds = await getSavedRecipeIdsByUser(userId)
        if (fetchVersion !== savedFetchVersionRef.current) return
        setCloudSavedRecipeIds(savedIds)
      } catch (err) {
        console.error('Failed to refresh saved recipes from Supabase:', err)
        if (fetchVersion !== savedFetchVersionRef.current) return
        notify.error('Failed to update saved recipes. Please try again.')
      }
    },
    [user]
  )

  const removeCloudSavedRecipeId = useCallback((recipeId: number) => {
    setCloudSavedRecipeIds((currentIds) =>
      currentIds.filter((id) => id !== recipeId)
    )
  }, [])

  const toggleSaved = useCallback(
    async (recipe: Recipe) => {
      const resolvedRecipe =
        recipeList.find((r) => getRecipeListKey(r) === getRecipeListKey(recipe)) ??
        recipe

      if (isSampleRecipe(resolvedRecipe)) {
        const recipeId = resolvedRecipe.id
        const next = sampleSavedRecipeIds.includes(recipeId)
          ? sampleSavedRecipeIds.filter((id) => id !== recipeId)
          : [...sampleSavedRecipeIds, recipeId]

        try {
          const serialized = JSON.stringify(next)
          localStorage.setItem('savedSampleRecipeIds', serialized)
          localStorage.setItem('favoriteSampleRecipeIds', serialized)
        } catch (err) {
          console.error('Failed to persist sample saved recipes:', err)
        }

        setSampleSavedRecipeIds(next)
        return
      }

      if (!user) {
        notify.info('Sign in to save recipes.')
        return
      }

      const supabaseRecipeId = getSupabaseRecipeId(resolvedRecipe)
      if (supabaseRecipeId === null) {
        console.error(
          'Cannot toggle saved recipe without a valid Supabase id:',
          resolvedRecipe
        )
        notify.error(
          'This recipe cannot be saved yet. Try refreshing.'
        )
        return
      }

      const currentlySaved = cloudSavedRecipeIds.includes(supabaseRecipeId)

      try {
        if (currentlySaved) {
          await unsaveRecipeForUser(user.id, supabaseRecipeId)
        } else {
          await saveRecipeForUser(user.id, supabaseRecipeId)
        }

        await refreshCloudSavedRecipeIds(user.id)
      } catch (err) {
        console.error('Failed to update saved recipe in Supabase:', err)
        notify.error('Failed to update saved recipes. Please try again.')
      }
    },
    [
      user,
      recipeList,
      sampleSavedRecipeIds,
      cloudSavedRecipeIds,
      refreshCloudSavedRecipeIds,
    ]
  )

  const savedCount = sampleSavedRecipeIds.length + cloudSavedRecipeIds.length

  return {
    cloudSavedRecipeIds,
    sampleSavedRecipeIds,
    savedCount,
    toggleSaved,
    removeCloudSavedRecipeId,
  }
}

/** @deprecated Use useSaved instead. */
export const useFavorites = useSaved
