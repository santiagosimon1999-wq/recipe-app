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

export function useFavorites(user: User | null, recipeList: Recipe[]) {
  const [cloudFavoriteRecipeIds, setCloudFavoriteRecipeIds] = useState<number[]>(
    []
  )
  const [sampleFavoriteIds, setSampleFavoriteIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('favoriteSampleRecipeIds')
      return stored ? (JSON.parse(stored) as number[]) : []
    } catch (err) {
      console.error('Failed to load sample favorites from localStorage:', err)
      return []
    }
  })

  const favoritesFetchVersionRef = useRef(0)

  useEffect(() => {
    if (!user) {
      favoritesFetchVersionRef.current += 1
      setCloudFavoriteRecipeIds([])
      return
    }

    const fetchVersion = favoritesFetchVersionRef.current + 1
    favoritesFetchVersionRef.current = fetchVersion
    const userId = user.id

    async function loadCloudFavorites() {
      try {
        const savedIds = await getSavedRecipeIdsByUser(userId)
        if (fetchVersion !== favoritesFetchVersionRef.current) return
        setCloudFavoriteRecipeIds(savedIds)
      } catch (err) {
        console.error('Failed to load saved favorites from Supabase:', err)
        if (fetchVersion !== favoritesFetchVersionRef.current) return
        setCloudFavoriteRecipeIds([])
      }
    }

    void loadCloudFavorites()
  }, [user])

  useEffect(() => {
    localStorage.setItem(
      'favoriteRecipeIds',
      JSON.stringify([
        ...cloudFavoriteRecipeIds.map((id) => `db:${id}`),
        ...sampleFavoriteIds.map((id) => `sample:${id}`),
      ])
    )
  }, [cloudFavoriteRecipeIds, sampleFavoriteIds])

  const refreshCloudFavorites = useCallback(
    async (userId: string) => {
      if (!user || userId !== user.id) {
        console.error('refreshCloudFavorites called with mismatched user id:', userId)
        return
      }

      const fetchVersion = favoritesFetchVersionRef.current + 1
      favoritesFetchVersionRef.current = fetchVersion

      try {
        const savedIds = await getSavedRecipeIdsByUser(userId)
        if (fetchVersion !== favoritesFetchVersionRef.current) return
        setCloudFavoriteRecipeIds(savedIds)
      } catch (err) {
        console.error('Failed to refresh saved favorites from Supabase:', err)
        if (fetchVersion !== favoritesFetchVersionRef.current) return
        notify.error('Failed to update favorites. Please try again.')
      }
    },
    [user]
  )

  const removeCloudFavorite = useCallback((recipeId: number) => {
    setCloudFavoriteRecipeIds((currentIds) =>
      currentIds.filter((id) => id !== recipeId)
    )
  }, [])

  const toggleFavorite = useCallback(
    async (recipe: Recipe) => {
      const resolvedRecipe =
        recipeList.find((r) => getRecipeListKey(r) === getRecipeListKey(recipe)) ??
        recipe

      if (isSampleRecipe(resolvedRecipe)) {
        const recipeId = resolvedRecipe.id
        const next = sampleFavoriteIds.includes(recipeId)
          ? sampleFavoriteIds.filter((id) => id !== recipeId)
          : [...sampleFavoriteIds, recipeId]

        try {
          localStorage.setItem('favoriteSampleRecipeIds', JSON.stringify(next))
        } catch (err) {
          console.error('Failed to persist sample favorites:', err)
        }

        setSampleFavoriteIds(next)
        return
      }

      if (!user) return

      const supabaseRecipeId = getSupabaseRecipeId(resolvedRecipe)
      if (supabaseRecipeId === null) {
        console.error(
          'Cannot favorite recipe without a valid Supabase id:',
          resolvedRecipe
        )
        notify.error(
          'This recipe cannot be saved to favorites yet. Try refreshing.'
        )
        return
      }

      const currentlySaved = cloudFavoriteRecipeIds.includes(supabaseRecipeId)

      try {
        if (currentlySaved) {
          await unsaveRecipeForUser(user.id, supabaseRecipeId)
        } else {
          await saveRecipeForUser(user.id, supabaseRecipeId)
        }

        await refreshCloudFavorites(user.id)
      } catch (err) {
        console.error('Failed to update favorite in Supabase:', err)
        notify.error('Failed to update favorites. Please try again.')
      }
    },
    [user, recipeList, sampleFavoriteIds, cloudFavoriteRecipeIds, refreshCloudFavorites]
  )

  const favoriteCount = sampleFavoriteIds.length + cloudFavoriteRecipeIds.length

  return {
    cloudFavoriteRecipeIds,
    sampleFavoriteIds,
    favoriteCount,
    toggleFavorite,
    removeCloudFavorite,
  }
}
