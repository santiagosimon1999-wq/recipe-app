import { useMemo, useState } from 'react'
import { isSavoraTeamRecipe } from '../lib/savoraTeam'
import type { Recipe } from '../types/Recipe'
import { isRecipeFavorited } from '../utils/favorites'

export function useRecipeFilters(
  recipeList: Recipe[],
  sampleFavoriteIds: number[],
  cloudFavoriteRecipeIds: number[]
) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase()

    return recipeList.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(normalizedSearch) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(normalizedSearch)
        )

      const matchesCategory =
        selectedCategory === 'All' || recipe.category === selectedCategory

      const matchesFavorites =
        !showFavoritesOnly ||
        isRecipeFavorited(recipe, sampleFavoriteIds, cloudFavoriteRecipeIds)

      return matchesSearch && matchesCategory && matchesFavorites
    })
  }, [
    recipeList,
    searchTerm,
    selectedCategory,
    showFavoritesOnly,
    sampleFavoriteIds,
    cloudFavoriteRecipeIds,
  ])

  const savoraInspirationRecipes = useMemo(
    () => filteredRecipes.filter((recipe) => isSavoraTeamRecipe(recipe)),
    [filteredRecipes]
  )

  const userRecipes = useMemo(
    () =>
      filteredRecipes.filter(
        (recipe) => recipe.source === 'user' && !isSavoraTeamRecipe(recipe)
      ),
    [filteredRecipes]
  )

  const communityRecipes = useMemo(
    () =>
      filteredRecipes.filter(
        (recipe) =>
          recipe.source === 'community' && !isSavoraTeamRecipe(recipe)
      ),
    [filteredRecipes]
  )

  const allUserRecipes = useMemo(
    () => recipeList.filter((recipe) => recipe.source === 'user'),
    [recipeList]
  )

  const averageCalories = useMemo(() => {
    if (allUserRecipes.length === 0) return 0
    const totalCalories = allUserRecipes.reduce(
      (total, recipe) => total + recipe.calories,
      0
    )
    return Math.round(totalCalories / allUserRecipes.length)
  }, [allUserRecipes])

  const showClearFiltersButton =
    searchTerm !== '' || selectedCategory !== 'All' || showFavoritesOnly

  function handleClearFilters() {
    setSearchTerm('')
    setSelectedCategory('All')
    setShowFavoritesOnly(false)
  }

  function handleToggleShowFavoritesOnly() {
    setShowFavoritesOnly((currentValue) => !currentValue)
  }

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    filteredRecipes,
    userRecipes,
    communityRecipes,
    savoraInspirationRecipes,
    allUserRecipes,
    averageCalories,
    showClearFiltersButton,
    handleClearFilters,
    handleToggleShowFavoritesOnly,
  }
}
