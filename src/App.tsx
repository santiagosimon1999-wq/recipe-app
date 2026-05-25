import { useEffect, useState } from 'react'
import './index.css'
import RecipeGrid from './components/RecipeGrid'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import RecipeModal from './components/RecipeModal'
import RecipeForm from './components/RecipeForm'
import { AuthGate } from './components/auth/AuthGate'
import { useAuth } from './context/useAuth'
import { recipes as initialRecipes } from './data/recipes'
import {
  calculateNutrition,
  debugParseIngredients,
} from './lib/nutritionService'
import {
  createRecipe,
  deleteRecipe as deleteRecipeById,
  getRecipes,
  updateRecipe as updateRecipeById,
} from './lib/recipeService'
import { uploadRecipeImage } from './lib/storageService'
import type { Recipe } from './types/Recipe'

function mapDbRecipeToUiRecipe(row: {
  id: number
  title: string
  image_url: string | null
  description: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string
}): Recipe {
  return {
    id: row.id,
    title: row.title,
    image: row.image_url ?? '',
    imageFile: null,
    description: row.description,
    category: row.category,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    ingredients: row.ingredients,
    instructions: row.instructions,
    source: 'user',
  }
}

function getUserInitial(email: string | undefined) {
  if (!email) return 'P'
  return email.charAt(0).toUpperCase()
}

function getUserName(email: string | undefined) {
  if (!email) return 'Panda'
  return email.split('@')[0]
}

export default function App() {
  const { logout, user } = useAuth()

  const [recipeList, setRecipeList] = useState<Recipe[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<number[]>(() => {
    try {
      const storedFavoriteRecipeIds = localStorage.getItem('favoriteRecipeIds')
      return storedFavoriteRecipeIds ? JSON.parse(storedFavoriteRecipeIds) : []
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error)
      return []
    }
  })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme')
    return storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : 'light'
  })
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [recipeBeingEdited, setRecipeBeingEdited] = useState<Recipe | null>(null)
  const [formMessage, setFormMessage] = useState('')
  const [savingRecipe, setSavingRecipe] = useState(false)

  useEffect(() => {
    async function loadRecipes() {
      if (!user) {
        setRecipeList(initialRecipes)
        return
      }

      try {
        const rows = await getRecipes(user.id)
        const mappedRecipes = rows.map(mapDbRecipeToUiRecipe)
        setRecipeList([...mappedRecipes, ...initialRecipes])
      } catch (error) {
        console.error('Failed to load recipes from Supabase:', error)
        setRecipeList(initialRecipes)
      }
    }

    void loadRecipes()
  }, [user])

  useEffect(() => {
    localStorage.setItem('favoriteRecipeIds', JSON.stringify(favoriteRecipeIds))
  }, [favoriteRecipeIds])

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (!formMessage) return

    const timeoutId = window.setTimeout(() => {
      setFormMessage('')
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [formMessage])

  const filteredRecipes = recipeList.filter((recipe) => {
    const normalizedSearch = searchTerm.toLowerCase()

    const matchesSearch =
      recipe.title.toLowerCase().includes(normalizedSearch) ||
      recipe.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(normalizedSearch)
      )

    const matchesCategory =
      selectedCategory === 'All' || recipe.category === selectedCategory

    const matchesFavorites =
      !showFavoritesOnly || favoriteRecipeIds.includes(recipe.id)

    return matchesSearch && matchesCategory && matchesFavorites
  })

  const userRecipes = filteredRecipes.filter((recipe) => recipe.source === 'user')
  const sampleRecipes = filteredRecipes.filter(
    (recipe) => recipe.source !== 'user'
  )

  const allUserRecipes = recipeList.filter((recipe) => recipe.source === 'user')
  const totalCalories = allUserRecipes.reduce(
    (total, recipe) => total + recipe.calories,
    0
  )
  const averageCalories =
    allUserRecipes.length > 0 ? Math.round(totalCalories / allUserRecipes.length) : 0

  const showClearFiltersButton =
    searchTerm !== '' || selectedCategory !== 'All' || showFavoritesOnly

  const canManageSelectedRecipe = !!user && selectedRecipe?.source === 'user'

  async function handleAddRecipe(recipeData: Recipe) {
    if (!user || savingRecipe) return

    setSavingRecipe(true)
    setFormMessage('')

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
          setFormMessage('Sample recipes cannot be edited.')
          return
        }

        const updatedRow = await updateRecipeById(recipeBeingEdited.id, {
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
        })

        const updatedRecipe = mapDbRecipeToUiRecipe(updatedRow)

        setRecipeList((currentRecipes) =>
          currentRecipes.map((recipe) =>
            recipe.id === recipeBeingEdited.id ? updatedRecipe : recipe
          )
        )

        setSelectedRecipe(updatedRecipe)
        setFormMessage('Recipe updated successfully.')
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
        })

        const createdRecipe = mapDbRecipeToUiRecipe(createdRow)

        setRecipeList((currentRecipes) => [createdRecipe, ...currentRecipes])
        setFormMessage('Recipe added successfully.')
      }

      setShowRecipeForm(false)
      setRecipeBeingEdited(null)
    } catch (error) {
      console.error('Failed to save recipe:', error)

      if (error instanceof Error) {
        setFormMessage(`Failed to save recipe: ${error.message}`)
      } else {
        setFormMessage('Failed to save recipe.')
      }
    } finally {
      setSavingRecipe(false)
    }
  }

  function handleStartCreateRecipe() {
    if (!user) return

    setRecipeBeingEdited(null)
    setShowRecipeForm(true)
    setSelectedRecipe(null)
    setFormMessage('')
  }

  function handleStartEditRecipe(recipe: Recipe) {
    if (!user) return

    if (recipe.source !== 'user') {
      setFormMessage('Sample recipes cannot be edited.')
      return
    }

    setRecipeBeingEdited(recipe)
    setShowRecipeForm(true)
    setSelectedRecipe(null)
    setFormMessage('')
  }

  function handleCancelRecipeForm() {
    if (savingRecipe) return

    setShowRecipeForm(false)
    setRecipeBeingEdited(null)
  }

  async function handleDeleteRecipe(recipeId: number) {
    if (!user) return

    const recipeToDelete = recipeList.find((recipe) => recipe.id === recipeId)

    if (recipeToDelete?.source !== 'user') {
      setFormMessage('Sample recipes cannot be deleted.')
      return
    }

    const confirmed = window.confirm(
      `Delete "${recipeToDelete?.title ?? 'this recipe'}"?`
    )

    if (!confirmed) return

    try {
      await deleteRecipeById(recipeId)

      setRecipeList((currentRecipes) =>
        currentRecipes.filter((recipe) => recipe.id !== recipeId)
      )

      setFavoriteRecipeIds((currentIds) =>
        currentIds.filter((id) => id !== recipeId)
      )

      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null)
      }

      if (recipeBeingEdited?.id === recipeId) {
        setRecipeBeingEdited(null)
        setShowRecipeForm(false)
      }

      setFormMessage('Recipe deleted.')
    } catch (error) {
      console.error('Failed to delete recipe:', error)
      setFormMessage('Failed to delete recipe.')
    }
  }

  function handleClearFilters() {
    setSearchTerm('')
    setSelectedCategory('All')
    setShowFavoritesOnly(false)
  }

  function handleToggleFavorite(recipeId: number) {
    setFavoriteRecipeIds((currentIds) =>
      currentIds.includes(recipeId)
        ? currentIds.filter((id) => id !== recipeId)
        : [...currentIds, recipeId]
    )
  }

  function handleToggleShowFavoritesOnly() {
    setShowFavoritesOnly((currentValue) => !currentValue)
  }

  function handleSelectRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe)
  }

  function handleCloseModal() {
    setSelectedRecipe(null)
  }

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <AuthGate>
      <main className={`app app--${theme}`}>
        <div className="app__container">
          <header className="app-hero">
            <nav className="app-nav">
              <div>
                <p className="app-eyebrow">Recipe social tracker</p>
                <h1 className="app__title">Panda Recipes</h1>
              </div>

              <div className="app-nav__actions">
                <button
                  type="button"
                  className="theme-toggle-button"
                  onClick={handleToggleTheme}
                >
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>

                {user ? (
                  <button
                    type="button"
                    className="logout-button"
                    onClick={() => void logout()}
                  >
                    Log out
                  </button>
                ) : null}
              </div>
            </nav>

            <section className="profile-card">
              <div className="profile-card__main">
                <div className="profile-card__avatar">
                  {getUserInitial(user?.email)}
                </div>

                <div>
                  <p className="profile-card__label">Welcome back</p>
                  <h2 className="profile-card__name">
                    {getUserName(user?.email)}
                  </h2>
                  <p className="profile-card__email">{user?.email}</p>
                </div>
              </div>

              <div className="profile-card__stats">
                <div className="profile-stat">
                  <span>{allUserRecipes.length}</span>
                  <p>Recipes</p>
                </div>

                <div className="profile-stat">
                  <span>{favoriteRecipeIds.length}</span>
                  <p>Favorites</p>
                </div>

                <div className="profile-stat">
                  <span>{averageCalories}</span>
                  <p>Avg cal</p>
                </div>
              </div>
            </section>

            <section className="hero-content">
              <div>
                <p className="app__subtitle">
                  Save your recipes, track macros, and discover meal ideas like a
                  social recipe board.
                </p>

                <div className="hero-tags">
                  <span>📸 Social recipe sharing</span>
                  <span>🥗 Macro tracking</span>
                </div>
              </div>

              {user ? (
                <button
                  type="button"
                  className="create-recipe-toggle-button"
                  onClick={handleStartCreateRecipe}
                  disabled={savingRecipe}
                >
                  + Create Recipe
                </button>
              ) : null}
            </section>
          </header>

          {formMessage ? <p className="form-message">{formMessage}</p> : null}

          {showRecipeForm ? (
            <RecipeForm
              key={recipeBeingEdited?.id ?? 'new'}
              initialRecipe={recipeBeingEdited}
              onSaveRecipe={handleAddRecipe}
              onCancel={handleCancelRecipeForm}
            />
          ) : null}

          <section className="discover-panel">
            <div className="discover-panel__header">
              <div>
                <p className="app-eyebrow">Discover</p>
                <h2>Find your next meal</h2>
              </div>
            </div>

            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="filter-actions">
              <button
                type="button"
                className={
                  showFavoritesOnly
                    ? 'favorites-toggle-button favorites-toggle-button--active'
                    : 'favorites-toggle-button'
                }
                onClick={handleToggleShowFavoritesOnly}
              >
                {showFavoritesOnly ? '★ Favorites only' : '☆ Show favorites'}
              </button>

              {showClearFiltersButton ? (
                <button
                  type="button"
                  className="clear-filters-button"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </section>

          {userRecipes.length > 0 ? (
            <section className="recipe-section">
              <div className="recipe-section__header">
                <div>
                  <p className="app-eyebrow">Your kitchen</p>
                  <h2>Your Recipes</h2>
                </div>
                <span>{userRecipes.length} saved</span>
              </div>

              <RecipeGrid
                recipes={userRecipes}
                favoriteRecipeIds={favoriteRecipeIds}
                onToggleFavorite={handleToggleFavorite}
                onSelectRecipe={handleSelectRecipe}
              />
            </section>
          ) : (
            <section className="empty-profile-state">
              <h2>Your recipe board is empty</h2>
              <p>
                Create your first recipe with ingredients, macros, instructions,
                and a real image.
              </p>
              <button type="button" onClick={handleStartCreateRecipe}>
                Create your first recipe
              </button>
            </section>
          )}

          {sampleRecipes.length > 0 ? (
            <section className="recipe-section">
              <div className="recipe-section__header">
                <div>
                  <p className="app-eyebrow">Community inspiration</p>
                  <h2>Explore Recipes</h2>
                </div>
                <span>{sampleRecipes.length} ideas</span>
              </div>

              <RecipeGrid
                recipes={sampleRecipes}
                favoriteRecipeIds={favoriteRecipeIds}
                onToggleFavorite={handleToggleFavorite}
                onSelectRecipe={handleSelectRecipe}
              />
            </section>
          ) : null}

          {selectedRecipe ? (
            <RecipeModal
              recipe={selectedRecipe}
              onClose={handleCloseModal}
              onEdit={handleStartEditRecipe}
              onDelete={handleDeleteRecipe}
              canManage={canManageSelectedRecipe}
            />
          ) : null}
        </div>
      </main>
    </AuthGate>
  )
}