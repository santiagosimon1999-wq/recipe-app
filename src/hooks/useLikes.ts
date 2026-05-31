import { useCallback, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Recipe } from '../types/Recipe'
import { notifyRecipeOwner } from '../lib/notifyRecipeOwner'
import { likeRecipe, unlikeRecipe } from '../lib/recipeService'
import { notify } from '../lib/toast'

type UseLikesParams = {
  user: User | null
  recipeList: Recipe[]
  setRecipeList: React.Dispatch<React.SetStateAction<Recipe[]>>
  selectedRecipe: Recipe | null
  setSelectedRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>
  likedRecipeIds: number[]
  setLikedRecipeIds: React.Dispatch<React.SetStateAction<number[]>>
}

export function useLikes({
  user,
  recipeList,
  setRecipeList,
  selectedRecipe,
  setSelectedRecipe,
  likedRecipeIds,
  setLikedRecipeIds,
}: UseLikesParams) {
  function getLikeErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return 'Failed to update like. Please try again.'
    }

    const record = error as { code?: string; message?: string }
    const message = record.message?.toLowerCase() ?? ''
    if (record.code === 'P0001' || message.includes('too quickly')) {
      return 'You are liking recipes too quickly. Please wait and try again.'
    }

    return 'Failed to update like. Please try again.'
  }

  const toggleLike = useCallback(
    async (recipeId: number) => {
      if (!user) return
      const recipe = recipeList.find((r) => r.id === recipeId)
      if (!recipe) return

      if (recipe.source === 'sample') {
        console.warn(
          'Attempted to like sample recipe; likes are disabled for sample recipes.'
        )
        return
      }

      const currentlyLiked = likedRecipeIds.includes(recipeId)
      const prevLikedIds = likedRecipeIds
      const prevRecipeList = recipeList
      const prevSelected = selectedRecipe

      if (currentlyLiked) {
        setLikedRecipeIds((ids) => ids.filter((id) => id !== recipeId))
        setRecipeList((list) =>
          list.map((r) =>
            r.id === recipeId
              ? { ...r, liked: false, likeCount: Math.max(0, r.likeCount - 1) }
              : r
          )
        )
        setSelectedRecipe((current) =>
          current && current.id === recipeId
            ? {
                ...current,
                liked: false,
                likeCount: Math.max(0, current.likeCount - 1),
              }
            : current
        )

        try {
          await unlikeRecipe(user.id, recipeId)
        } catch (err) {
          console.error('Failed to unlike:', err)
          notify.error(getLikeErrorMessage(err))
          setLikedRecipeIds(prevLikedIds)
          setRecipeList(prevRecipeList)
          setSelectedRecipe(prevSelected)
        }
      } else {
        setLikedRecipeIds((ids) =>
          ids.includes(recipeId) ? ids : [...ids, recipeId]
        )
        setRecipeList((list) =>
          list.map((r) =>
            r.id === recipeId
              ? { ...r, liked: true, likeCount: r.likeCount + 1 }
              : r
          )
        )
        setSelectedRecipe((current) =>
          current && current.id === recipeId
            ? { ...current, liked: true, likeCount: current.likeCount + 1 }
            : current
        )

        try {
          await likeRecipe(user.id, recipeId)
          void notifyRecipeOwner(
            recipeId,
            user.id,
            'like',
            'Someone liked your recipe.'
          )
        } catch (err) {
          console.error('Failed to like:', err)
          notify.error(getLikeErrorMessage(err))
          setLikedRecipeIds(prevLikedIds)
          setRecipeList(prevRecipeList)
          setSelectedRecipe(prevSelected)
        }
      }
    },
    [
      user,
      recipeList,
      likedRecipeIds,
      selectedRecipe,
      setRecipeList,
      setSelectedRecipe,
      setLikedRecipeIds,
    ]
  )

  return { toggleLike }
}

/** Local state for liked ids — enriched onto recipes during load. */
export function useLikedRecipeIds() {
  return useState<number[]>([])
}
