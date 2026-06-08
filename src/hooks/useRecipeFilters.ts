import { useMemo, useState } from 'react'
import { isSavoraTeamRecipe } from '../lib/savoraTeam'
import type { Recipe } from '../types/Recipe'
import {
  recipeCategorySearchText,
  recipeMatchesSelectedCategories,
  toggleSelectedCategories,
} from '../utils/categories'
import { isRecipeSaved } from '../utils/favorites'

export function useRecipeFilters(
  recipeList: Recipe[],
  sampleSavedRecipeIds: number[],
  cloudSavedRecipeIds: number[]
) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showSavedOnly, setShowSavedOnly] = useState(false)

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase()

    return recipeList.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(normalizedSearch) ||
        recipeCategorySearchText(recipe).includes(normalizedSearch) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(normalizedSearch)
        )

      const matchesCategory = recipeMatchesSelectedCategories(
        recipe,
        selectedCategories,
      )

      const matchesSaved =
        !showSavedOnly ||
        isRecipeSaved(recipe, sampleSavedRecipeIds, cloudSavedRecipeIds)

      return matchesSearch && matchesCategory && matchesSaved
    })
  }, [
    recipeList,
    searchTerm,
    selectedCategories,
    showSavedOnly,
    sampleSavedRecipeIds,
    cloudSavedRecipeIds,
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
    searchTerm !== '' || selectedCategories.length > 0 || showSavedOnly

  function handleCategoryToggle(category: string) {
    setSelectedCategories((current) => toggleSelectedCategories(current, category))
  }

  function handleClearFilters() {
    setSearchTerm('')
    setSelectedCategories([])
    setShowSavedOnly(false)
  }

  function handleToggleShowSavedOnly() {
    setShowSavedOnly((currentValue) => !currentValue)
  }

  return {
    searchTerm,
    setSearchTerm,
    selectedCategories,
    handleCategoryToggle,
    showSavedOnly,
    filteredRecipes,
    userRecipes,
    communityRecipes,
    savoraInspirationRecipes,
    allUserRecipes,
    averageCalories,
    showClearFiltersButton,
    handleClearFilters,
    handleToggleShowSavedOnly,
  }
}
