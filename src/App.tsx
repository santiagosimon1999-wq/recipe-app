import { useEffect, useState } from 'react'
import './index.css'
import { AuthGate } from './components/auth/AuthGate'
import { useAuth } from './context/useAuth'
import AppHeader from './components/AppHeader'
import DiscoverPanel from './components/DiscoverPanel'
import RecipeDashboard from './components/RecipeDashboard'
import RecipeForm from './components/RecipeForm'
import CommunityFeedPage from './pages/CommunityFeedPage'
import ProfilePage from './pages/ProfilePage'
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
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
  likeRecipe,
  unlikeRecipe,
} from './lib/recipeService'
import { supabase } from './lib/supabaseClient'
import { uploadRecipeImage } from './lib/storageService'
import type { Recipe } from './types/Recipe'

type DbRecipeRow = {
  id: number
  user_id: string
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
  author_name?: string | null
  is_public?: boolean | null
}

type Profile = {
  id: string
  display_name: string | null
  username: string | null
}

const starterRecipes: Recipe[] = initialRecipes.map((recipe) => ({
  ...recipe,
  source: 'sample',
  isPublic: true,
  authorName: 'Panda Recipes',
  likeCount: 0,
  liked: false,
}))

function mapDbRecipeToUiRecipe(
  row: DbRecipeRow,
  currentUserId?: string
): Recipe {
  const belongsToCurrentUser = row.user_id === currentUserId

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
    source: belongsToCurrentUser ? 'user' : 'community',
    userId: row.user_id,
    authorName: row.author_name ?? 'Panda Chef',
    isPublic: row.is_public ?? true,
    likeCount: 0,
    liked: false,
  }
}

function getUserInitial(nameOrEmail: string | undefined) {
  if (!nameOrEmail) return 'P'
  return nameOrEmail.charAt(0).toUpperCase()
}

function getFallbackUserName(email: string | undefined) {
  if (!email) return 'Panda'
  return email.split('@')[0]
}

export default function App() {
  const { logout, user } = useAuth()
  const [recipeList, setRecipeList] = useState<Recipe[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
    const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<number[]>(() => {
      // start empty; we'll load saved favorites from Supabase (and local sample favorites) in effect
      return []
    })
    const [sampleFavoriteIds, setSampleFavoriteIds] = useState<number[]>(() => {
      try {
        const stored = localStorage.getItem('favoriteSampleRecipeIds')
        return stored ? JSON.parse(stored) : []
      } catch (err) {
        console.error('Failed to load sample favorites from localStorage:', err)
        return []
      }
    })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [likedRecipeIds, setLikedRecipeIds] = useState<number[]>([])
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
  const [view, setView] = useState<'dashboard' | 'profile' | 'community'>('dashboard')

  const displayName =
    profile?.display_name || getFallbackUserName(user?.email)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null)
        return
      }

      const fallbackName = getFallbackUserName(user.email)

      try {
        const { data: existingProfile, error: profileError } =
          await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) throw profileError

        if (existingProfile) {
          setProfile(existingProfile as Profile)
          return
        }

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            display_name: fallbackName,
            username: fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          })
          .select()
          .single()

        if (insertError) throw insertError

        setProfile(newProfile as Profile)
      } catch (error) {
        console.error('Failed to load profile:', error)
        setProfile({
          id: user.id,
          display_name: fallbackName,
          username: fallbackName.toLowerCase(),
        })
      }
    }

    void loadProfile()
  }, [user])

  useEffect(() => {
    async function loadRecipes() {
      if (!user) {
        try {
          const { data: publicRows, error: publicError } = await supabase
            .from('recipes')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false })

          if (publicError) throw publicError

          const publicRecipes = ((publicRows ?? []) as DbRecipeRow[]).map(
            (row) => mapDbRecipeToUiRecipe(row)
          )

          setRecipeList([...publicRecipes, ...starterRecipes])
        } catch (error) {
          console.error('Failed to load public community recipes:', error)
          setRecipeList(starterRecipes)
        }

        return
      }

      try {
        const ownRows = (await getRecipes(user.id)) as DbRecipeRow[]

        const { data: communityRows, error: communityError } = await supabase
          .from('recipes')
          .select('*')
          .eq('is_public', true)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (communityError) throw communityError

        const ownRecipes = ownRows.map((row) =>
          mapDbRecipeToUiRecipe(row, user.id)
        )

        const communityRecipes = ((communityRows ?? []) as DbRecipeRow[]).map(
          (row) => mapDbRecipeToUiRecipe(row, user.id)
        )

        // Combine and then fetch like counts and liked ids for the current user
        const combined = [...ownRecipes, ...communityRecipes, ...starterRecipes]
        const recipeIds = combined.map((r) => r.id)

        const likedIds: number[] = (await getLikedRecipeIdsByUser(user.id).catch(() => [])) as number[]
        const likeCounts: Record<number, number> = (await getLikesCountsForRecipeIds(recipeIds).catch(
          () => ({} as Record<number, number>)
        )) as Record<number, number>

        const enriched = combined.map((r) => ({
          ...r,
          likeCount: likeCounts[r.id] ?? 0,
          liked: Array.isArray(likedIds) && likedIds.includes(r.id),
        }))

        setLikedRecipeIds(likedIds)
          setRecipeList(enriched)
          // Load saved favorites for current user from Supabase
          const savedIds: number[] = []

          // Merge with local sample favorites (only for sample recipes that can't be saved server-side)
          const mergedFavorites = Array.from(new Set([...savedIds, ...sampleFavoriteIds]))

          setFavoriteRecipeIds(mergedFavorites)
      } catch (error) {
        console.error('Failed to load recipes from Supabase:', error)

        try {
          const rows = (await getRecipes(user.id)) as DbRecipeRow[]
          const mappedRecipes = rows.map((row) =>
            mapDbRecipeToUiRecipe(row, user.id)
          )
          setRecipeList([...mappedRecipes, ...starterRecipes])
        } catch {
          setRecipeList(starterRecipes)
        }
      }
    }

    void loadRecipes()
  }, [user, sampleFavoriteIds])

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
  const communityRecipes = filteredRecipes.filter(
    (recipe) => recipe.source === 'community'
  )
  const sampleRecipes = filteredRecipes.filter(
    (recipe) => recipe.source === 'sample'
  )

  const allUserRecipes = recipeList.filter((recipe) => recipe.source === 'user')
  const totalCalories = allUserRecipes.reduce(
    (total, recipe) => total + recipe.calories,
    0
  )
  const averageCalories =
    allUserRecipes.length > 0
      ? Math.round(totalCalories / allUserRecipes.length)
      : 0

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
          setFormMessage('Only your own recipes can be edited.')
          return
        }

        const updatedRow = (await updateRecipeById(recipeBeingEdited.id, {
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
        })) as DbRecipeRow

        await supabase
          .from('recipes')
          .update({
            author_name: displayName,
            is_public: recipeBeingEdited.isPublic ?? true,
          })
          .eq('id', recipeBeingEdited.id)

        const updatedRecipe = mapDbRecipeToUiRecipe(
          {
            ...updatedRow,
            author_name: displayName,
            is_public: recipeBeingEdited.isPublic ?? true,
          },
          user.id
        )

        setRecipeList((currentRecipes) =>
          currentRecipes.map((recipe) =>
            recipe.id === recipeBeingEdited.id ? updatedRecipe : recipe
          )
        )

        setSelectedRecipe(updatedRecipe)
        setFormMessage('Recipe updated successfully.')
      } else {
        const createdRow = (await createRecipe(user.id, {
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
        })) as DbRecipeRow

        await supabase
          .from('recipes')
          .update({
            author_name: displayName,
            is_public: recipeData.isPublic,
          })
          .eq('id', createdRow.id)

        const createdRecipe = mapDbRecipeToUiRecipe(
          {
            ...createdRow,
            author_name: displayName,
            is_public: true,
          },
          user.id
        )

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
      setFormMessage('Only your own recipes can be edited.')
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
      setFormMessage('Only your own recipes can be deleted.')
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

  async function handleToggleRecipePublic(recipe: Recipe) {
    if (!user || recipe.source !== 'user') return

    const nextIsPublic = !recipe.isPublic

    try {
      const { data, error } = await supabase
        .from('recipes')
        .update({
          is_public: nextIsPublic,
          author_name: displayName,
        })
        .eq('id', recipe.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      const updatedRecipe = mapDbRecipeToUiRecipe(data as DbRecipeRow, user.id)

      setRecipeList((currentRecipes) =>
        currentRecipes.map((currentRecipe) =>
          currentRecipe.id === recipe.id ? updatedRecipe : currentRecipe
        )
      )

      setSelectedRecipe(updatedRecipe)

      setFormMessage(
        updatedRecipe.isPublic
          ? 'Recipe shared with the community.'
          : 'Recipe is now private.'
      )
    } catch (error) {
      console.error('Failed to update recipe visibility:', error)
      setFormMessage('Failed to update recipe visibility.')
    }
  }

  function handleClearFilters() {
    setSearchTerm('')
    setSelectedCategory('All')
    setShowFavoritesOnly(false)
  }

  function handleToggleFavorite(recipeId: number) {
      const recipe = recipeList.find((r) => r.id === recipeId)
      if (!recipe) return

      // Sample recipes are not stored in Supabase; keep favorites locally for them
      if (recipe.source === 'sample') {
        setSampleFavoriteIds((current) => {
          const next = current.includes(recipeId)
            ? current.filter((id) => id !== recipeId)
            : [...current, recipeId]
          try {
            localStorage.setItem('favoriteSampleRecipeIds', JSON.stringify(next))
          } catch (err) {
            console.error('Failed to persist sample favorites:', err)
          }
          // Update combined favoriteRecipeIds
          setFavoriteRecipeIds((existing) => {
            const without = existing.filter((id) => id !== recipeId)
            if (next.includes(recipeId)) return Array.from(new Set([...without, recipeId]))
            return without
          })

          return next
        })

        return
      }

      // For server-backed recipes, persist via Supabase with optimistic update
      const currentlySaved = favoriteRecipeIds.includes(recipeId)

      const prevSaved = favoriteRecipeIds
      const prevList = recipeList

      if (currentlySaved) {
        // Unsave
        setFavoriteRecipeIds((ids) => ids.filter((id) => id !== recipeId))
        try {
          // Cloud favorites not implemented yet
        } catch (err) {
          console.error('Failed to unsave recipe:', err)
          setFormMessage('Failed to update favorites. Please try again.')
          setFavoriteRecipeIds(prevSaved)
          setRecipeList(prevList)
        }
      } else {
        // Save
        setFavoriteRecipeIds((ids) => Array.from(new Set([...ids, recipeId])))
        try {
          // Cloud favorites not implemented yet
        } catch (err) {
          console.error('Failed to save recipe:', err)
          setFormMessage('Failed to update favorites. Please try again.')
          setFavoriteRecipeIds(prevSaved)
          setRecipeList(prevList)
        }
      }
  }

  function handleToggleShowFavoritesOnly() {
    setShowFavoritesOnly((currentValue) => !currentValue)
  }

  async function handleToggleLike(recipeId: number) {
    if (!user) return
    const recipe = recipeList.find((r) => r.id === recipeId)
    if (!recipe) return

    // Do not allow liking sample (local) recipes that are not stored in Supabase
    if (recipe.source === 'sample') {
      console.warn('Attempted to like sample recipe; likes are disabled for sample recipes.')
      return
    }
    const currentlyLiked = likedRecipeIds.includes(recipeId)

    // Snapshot previous state for safe revert
    const prevLikedIds = likedRecipeIds
    const prevRecipeList = recipeList
    const prevSelected = selectedRecipe

    // Apply optimistic update
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
          ? { ...current, liked: false, likeCount: Math.max(0, current.likeCount - 1) }
          : current
      )

      try {
        await unlikeRecipe(user.id, recipeId)
      } catch (err) {
        console.error('Failed to unlike:', err)
        setFormMessage('Failed to unlike recipe. Please try again.')
        // Revert to previous state
        setLikedRecipeIds(prevLikedIds)
        setRecipeList(prevRecipeList)
        setSelectedRecipe(prevSelected)
      }
    } else {
      setLikedRecipeIds((ids) => (ids.includes(recipeId) ? ids : [...ids, recipeId]))
      setRecipeList((list) =>
        list.map((r) =>
          r.id === recipeId ? { ...r, liked: true, likeCount: r.likeCount + 1 } : r
        )
      )
      setSelectedRecipe((current) =>
        current && current.id === recipeId
          ? { ...current, liked: true, likeCount: current.likeCount + 1 }
          : current
      )

      try {
        await likeRecipe(user.id, recipeId)
      } catch (err) {
        console.error('Failed to like:', err)
        setFormMessage('Failed to like recipe. Please try again.')
        // Revert
        setLikedRecipeIds(prevLikedIds)
        setRecipeList(prevRecipeList)
        setSelectedRecipe(prevSelected)
      }
    }
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
          <AppHeader
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onChangeView={setView}
            view={view}
            onLogout={() => void logout()}
            onStartCreateRecipe={handleStartCreateRecipe}
            savingRecipe={savingRecipe}
            displayName={displayName}
            email={user?.email}
            userInitial={getUserInitial(displayName || user?.email)}
            totalRecipes={allUserRecipes.length}
            favoriteCount={favoriteRecipeIds.length}
            averageCalories={averageCalories}
            isLoggedIn={Boolean(user)}
          />

          {view === 'profile' ? (
            <ProfilePage />
          ) : view === 'community' ? (
            <CommunityFeedPage
              recipes={communityRecipes}
              sampleRecipes={sampleRecipes}
              favoriteRecipeIds={favoriteRecipeIds}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              showFavoritesOnly={showFavoritesOnly}
              showClearFiltersButton={showClearFiltersButton}
              onSearchChange={setSearchTerm}
              onCategoryChange={setSelectedCategory}
              onToggleShowFavoritesOnly={handleToggleShowFavoritesOnly}
              onClearFilters={handleClearFilters}
              onToggleFavorite={handleToggleFavorite}
              onSelectRecipe={handleSelectRecipe}
              onToggleLike={handleToggleLike}
            />
          ) : (
            <>
              {formMessage ? (
                <p className="form-message">{formMessage}</p>
              ) : null}

              {showRecipeForm ? (
                <RecipeForm
                  key={recipeBeingEdited?.id ?? 'new'}
                  initialRecipe={recipeBeingEdited}
                  onSaveRecipe={handleAddRecipe}
                  onCancel={handleCancelRecipeForm}
                />
              ) : null}

              <DiscoverPanel
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                showFavoritesOnly={showFavoritesOnly}
                showClearFiltersButton={showClearFiltersButton}
                onSearchChange={setSearchTerm}
                onCategoryChange={setSelectedCategory}
                onToggleShowFavoritesOnly={handleToggleShowFavoritesOnly}
                onClearFilters={handleClearFilters}
              />

              <RecipeDashboard
                userRecipes={userRecipes}
                communityRecipes={communityRecipes}
                sampleRecipes={sampleRecipes}
                favoriteRecipeIds={favoriteRecipeIds}
                onToggleFavorite={handleToggleFavorite}
                onSelectRecipe={handleSelectRecipe}
                onStartCreateRecipe={handleStartCreateRecipe}
                onToggleLike={handleToggleLike}
                selectedRecipe={selectedRecipe}
                canManageSelectedRecipe={canManageSelectedRecipe}
                onCloseModal={handleCloseModal}
                onEditRecipe={handleStartEditRecipe}
                onDeleteRecipe={handleDeleteRecipe}
                onTogglePublic={handleToggleRecipePublic}
              />
            </>
          )}
        </div>
      </main>
    </AuthGate>
  )
}
