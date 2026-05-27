import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { starterRecipes } from '../data/starterRecipes'
import {
  calculateNutrition,
  debugParseIngredients,
} from '../lib/nutritionService'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
import {
  COMMUNITY_PAGE_SIZE,
  createRecipe,
  deleteRecipe as deleteRecipeById,
  getCommunityRecipes,
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
  getRecipes,
  updateRecipe as updateRecipeById,
} from '../lib/recipeService'
import { notify } from '../lib/toast'
import { uploadRecipeImage } from '../lib/storageService'
import type { Recipe } from '../types/Recipe'
import { getSupabaseRecipeId, parseDbRecipeId } from '../utils/favorites'

async function enrichRecipesWithLikes(
  recipes: Recipe[],
  userId: string | undefined
): Promise<{ enriched: Recipe[]; likedIds: number[] }> {
  if (recipes.length === 0) {
    return { enriched: recipes, likedIds: [] }
  }

  const recipeIds = recipes
    .filter((recipe) => recipe.source !== 'sample')
    .map((recipe) => recipe.id)

  const likedIds = userId
    ? ((await getLikedRecipeIdsByUser(userId).catch(() => [])) as number[])
    : []

  const likeCounts =
    recipeIds.length > 0
      ? ((await getLikesCountsForRecipeIds(recipeIds).catch(
          () => ({}) as Record<number, number>
        )) as Record<number, number>)
      : {}

  const enriched = recipes.map((recipe) => {
    if (recipe.source === 'sample') {
      return recipe
    }

    return {
      ...recipe,
      likeCount: likeCounts[recipe.id] ?? 0,
      liked: likedIds.includes(recipe.id),
    }
  })

  return { enriched, likedIds }
}

export function useRecipes(user: User | null) {
  const [recipeList, setRecipeList] = useState<Recipe[]>([])
  const [likedRecipeIds, setLikedRecipeIds] = useState<number[]>([])
  const [hasMoreCommunity, setHasMoreCommunity] = useState(false)
  const [loadingMoreCommunity, setLoadingMoreCommunity] = useState(false)
  const communityCursorRef = useRef<string | null>(null)

  useEffect(() => {
    communityCursorRef.current = null
    setHasMoreCommunity(false)

    async function loadRecipes() {
      if (!user) {
        try {
          const publicRows = await getCommunityRecipes({ limit: COMMUNITY_PAGE_SIZE })
          const publicRecipes = publicRows.map((row) => mapDbRowToRecipe(row))

          communityCursorRef.current =
            publicRows.length > 0
              ? publicRows[publicRows.length - 1].created_at
              : null
          setHasMoreCommunity(publicRows.length >= COMMUNITY_PAGE_SIZE)

          const { enriched } = await enrichRecipesWithLikes(
            [...publicRecipes, ...starterRecipes],
            undefined
          )
          setLikedRecipeIds([])
          setRecipeList(enriched)
        } catch (error) {
          console.error('Failed to load public community recipes:', error)
          setRecipeList(starterRecipes)
          setLikedRecipeIds([])
        }

        return
      }

      try {
        const ownRows = await getRecipes(user.id)
        const communityRows = await getCommunityRecipes({
          excludeUserId: user.id,
          limit: COMMUNITY_PAGE_SIZE,
        })

        const ownRecipes = ownRows.map((row) => mapDbRowToRecipe(row, user.id))
        const communityRecipes = communityRows.map((row) =>
          mapDbRowToRecipe(row, user.id)
        )

        communityCursorRef.current =
          communityRows.length > 0
            ? communityRows[communityRows.length - 1].created_at
            : null
        setHasMoreCommunity(communityRows.length >= COMMUNITY_PAGE_SIZE)

        const combined = [...ownRecipes, ...communityRecipes, ...starterRecipes]
        const { enriched, likedIds } = await enrichRecipesWithLikes(
          combined,
          user.id
        )

        setLikedRecipeIds(likedIds)
        setRecipeList(enriched)
      } catch (error) {
        console.error('Failed to load recipes from Supabase:', error)

        try {
          const rows = await getRecipes(user.id)
          const mappedRecipes = rows.map((row) => mapDbRowToRecipe(row, user.id))
          setRecipeList([...mappedRecipes, ...starterRecipes])
        } catch {
          setRecipeList(starterRecipes)
        }
      }
    }

    void loadRecipes()
  }, [user])

  const loadMoreCommunity = useCallback(async () => {
    if (loadingMoreCommunity || !hasMoreCommunity) return

    const cursor = communityCursorRef.current
    if (!cursor) return

    setLoadingMoreCommunity(true)

    try {
      const communityRows = await getCommunityRecipes({
        excludeUserId: user?.id,
        limit: COMMUNITY_PAGE_SIZE,
        cursor,
      })

      if (communityRows.length === 0) {
        setHasMoreCommunity(false)
        return
      }

      communityCursorRef.current =
        communityRows[communityRows.length - 1].created_at
      setHasMoreCommunity(communityRows.length >= COMMUNITY_PAGE_SIZE)

      const newCommunityRecipes = communityRows.map((row) =>
        mapDbRowToRecipe(row, user?.id)
      )

      const { enriched: enrichedNew } = await enrichRecipesWithLikes(
        newCommunityRecipes,
        user?.id
      )

      setRecipeList((current) => {
        const existingIds = new Set(current.map((recipe) => recipe.id))
        const toAppend = enrichedNew.filter(
          (recipe) => !existingIds.has(recipe.id)
        )
        return toAppend.length > 0 ? [...current, ...toAppend] : current
      })

      if (user) {
        const newlyLiked = enrichedNew.filter((recipe) => recipe.liked).map((recipe) => recipe.id)
        if (newlyLiked.length > 0) {
          setLikedRecipeIds((current) => [
            ...new Set([...current, ...newlyLiked]),
          ])
        }
      }
    } catch (error) {
      console.error('Failed to load more community recipes:', error)
      notify.error('Failed to load more recipes. Please try again.')
    } finally {
      setLoadingMoreCommunity(false)
    }
  }, [user, loadingMoreCommunity, hasMoreCommunity])

  return {
    recipeList,
    setRecipeList,
    likedRecipeIds,
    setLikedRecipeIds,
    hasMoreCommunity,
    loadingMoreCommunity,
    loadMoreCommunity,
  }
}

type SaveRecipeParams = {
  recipeData: Recipe
  recipeBeingEdited: Recipe | null
  savingRecipe: boolean
  setSavingRecipe: (value: boolean) => void
  setShowRecipeForm: (value: boolean) => void
  setRecipeBeingEdited: (value: Recipe | null) => void
  setSelectedRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>
}

export function useRecipeMutations(
  user: User | null,
  setRecipeList: React.Dispatch<React.SetStateAction<Recipe[]>>,
  removeCloudFavorite: (recipeId: number) => void
) {
  const saveRecipe = useCallback(
    async ({
      recipeData,
      recipeBeingEdited,
      savingRecipe,
      setSavingRecipe,
      setShowRecipeForm,
      setRecipeBeingEdited,
      setSelectedRecipe,
    }: SaveRecipeParams) => {
      if (!user || savingRecipe) return

      setSavingRecipe(true)

      try {
        if (import.meta.env.DEV) {
          const nutritionDebug = debugParseIngredients(recipeData.ingredients)
          console.group('Nutrition debug')
          console.table(nutritionDebug)
          console.groupEnd()
        }

        const nutrition = await calculateNutrition(recipeData.ingredients)

        let imageUrl = recipeData.image || null

        if (recipeData.imageFile) {
          imageUrl = await uploadRecipeImage(user.id, recipeData.imageFile)
        }

        if (recipeBeingEdited) {
          if (recipeBeingEdited.source !== 'user') {
            notify.error('Only your own recipes can be edited.')
            return
          }

          const updatedRow = await updateRecipeById(
            recipeBeingEdited.id,
            user.id,
            {
              title: recipeData.title,
              description: recipeData.description,
              ingredients: recipeData.ingredients,
              instructions: recipeData.instructions,
              category: recipeData.category,
              image_url: imageUrl,
              calories: nutrition.calories,
              protein: nutrition.protein,
              carbs: nutrition.carbs,
              fat: nutrition.fat,
              is_public: recipeData.isPublic,
            }
          )

          const updatedRecipe = mapDbRowToRecipe(updatedRow, user.id)

          setRecipeList((currentRecipes) =>
            currentRecipes.map((recipe) =>
              recipe.id === recipeBeingEdited.id ? updatedRecipe : recipe
            )
          )

          setSelectedRecipe(updatedRecipe)
          notify.success('Recipe updated successfully.')
        } else {
          const createdRow = await createRecipe(user.id, {
            title: recipeData.title,
            description: recipeData.description,
            ingredients: recipeData.ingredients,
            instructions: recipeData.instructions,
            category: recipeData.category,
            image_url: imageUrl,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            is_public: recipeData.isPublic,
          })

          if (parseDbRecipeId(createdRow.id) === null) {
            console.error(
              'Create recipe did not return a valid Supabase id:',
              createdRow
            )
            throw new Error('Recipe saved without a valid database id')
          }

          const createdRecipe = mapDbRowToRecipe(createdRow, user.id)

          if (getSupabaseRecipeId(createdRecipe) === null) {
            console.error(
              'Created recipe is missing a favoritable Supabase id:',
              createdRecipe
            )
            throw new Error('Created recipe is missing a valid database id')
          }

          setRecipeList((currentRecipes) => [createdRecipe, ...currentRecipes])
          notify.success('Recipe added successfully.')
        }

        setShowRecipeForm(false)
        setRecipeBeingEdited(null)
      } catch (error) {
        console.error('Failed to save recipe:', error)

        if (error instanceof Error) {
          notify.error(`Failed to save recipe: ${error.message}`)
        } else {
          notify.error('Failed to save recipe.')
        }
      } finally {
        setSavingRecipe(false)
      }
    },
    [user, setRecipeList]
  )

  const deleteRecipe = useCallback(
    async (
      recipeId: number,
      recipeList: Recipe[],
      selectedRecipe: Recipe | null,
      recipeBeingEdited: Recipe | null,
      setSelectedRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>,
      setRecipeBeingEdited: (value: Recipe | null) => void,
      setShowRecipeForm: (value: boolean) => void
    ) => {
      if (!user) return false

      const recipeToDelete = recipeList.find((recipe) => recipe.id === recipeId)

      if (recipeToDelete?.source !== 'user') {
        notify.error('Only your own recipes can be deleted.')
        return false
      }

      try {
        await deleteRecipeById(recipeId, user.id)

        setRecipeList((currentRecipes) =>
          currentRecipes.filter((recipe) => recipe.id !== recipeId)
        )

        removeCloudFavorite(recipeId)

        if (selectedRecipe?.id === recipeId) {
          setSelectedRecipe(null)
        }

        if (recipeBeingEdited?.id === recipeId) {
          setRecipeBeingEdited(null)
          setShowRecipeForm(false)
        }

        notify.success('Recipe deleted.')
        return true
      } catch (error) {
        console.error('Failed to delete recipe:', error)
        notify.error('Failed to delete recipe.')
        return false
      }
    },
    [user, setRecipeList, removeCloudFavorite]
  )

  const toggleRecipePublic = useCallback(
    async (
      recipe: Recipe,
      setSelectedRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>
    ) => {
      if (!user || recipe.source !== 'user') return

      const nextIsPublic = !recipe.isPublic

      try {
        const updatedRow = await updateRecipeById(recipe.id, user.id, {
          is_public: nextIsPublic,
        })

        const updatedRecipe = mapDbRowToRecipe(updatedRow, user.id)

        setRecipeList((currentRecipes) =>
          currentRecipes.map((currentRecipe) =>
            currentRecipe.id === recipe.id ? updatedRecipe : currentRecipe
          )
        )

        setSelectedRecipe(updatedRecipe)

        notify.success(
          updatedRecipe.isPublic
            ? 'Recipe shared with the community.'
            : 'Recipe is now private.'
        )
      } catch (error) {
        console.error('Failed to update recipe visibility:', error)
        notify.error('Failed to update recipe visibility.')
      }
    },
    [user, setRecipeList]
  )

  return { saveRecipe, deleteRecipe, toggleRecipePublic }
}
