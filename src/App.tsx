import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router'
import './index.css'
import { AuthGate } from './components/auth/AuthGate'
import { ErrorBoundary } from './components/ErrorBoundary'
import { captureBoundaryError } from './lib/sentry'
import { useAuth } from './context/useAuth'
import AppHeader from './components/AppHeader'
import DiscoverPanel from './components/DiscoverPanel'
import RecipeDashboard from './components/RecipeDashboard'
import RecipeForm from './components/RecipeForm'
import RecipeModal from './components/RecipeModal'
import CommunityFeedPage from './pages/CommunityFeedPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import { recipes as initialRecipes } from './data/recipes'
import {
  calculateNutrition,
  debugParseIngredients,
} from './lib/nutritionService'
import {
  createRecipe,
  deleteRecipe as deleteRecipeById,
  getCommunityRecipes,
  getRecipes,
  updateRecipe as updateRecipeById,
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
  getSavedRecipeIdsByUser,
  likeRecipe,
  saveRecipeForUser,
  unlikeRecipe,
  unsaveRecipeForUser,
} from './lib/recipeService'
import { mapDbRowToRecipe } from './lib/recipeMappers'
import { supabase } from './lib/supabaseClient'
import { uploadRecipeImage } from './lib/storageService'
import type { Recipe } from './types/Recipe'
import {
  getRecipeListKey,
  getSupabaseRecipeId,
  isRecipeFavorited,
  isSampleRecipe,
  parseDbRecipeId,
} from './utils/favorites'

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
    const [cloudFavoriteRecipeIds, setCloudFavoriteRecipeIds] = useState<number[]>(() => {
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
  const navigate = useNavigate()
  const location = useLocation()
  const isPublicProfileRoute = location.pathname.startsWith('/users/')
  const isStandaloneAuthRoute =
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password'
  const favoritesFetchVersionRef = useRef(0)

  const displayName =
    profile?.display_name || getFallbackUserName(user?.email)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null)
        return
      }

      const fallbackName = getFallbackUserName(user.email)
      const profileData = {
        id: user.id,
        display_name: fallbackName,
        username: fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      }

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

        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })
          .select()
          .single()

        if (upsertError) {
          const conflictCode =
            (upsertError as { code?: string }).code ??
            (upsertError as { status?: number }).status

          if (conflictCode === '23505' || conflictCode === 409) {
            const { data: racedProfile, error: racedError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (racedError) throw racedError
            setProfile(racedProfile as Profile)
            return
          }

          throw upsertError
        }

        setProfile(upsertedProfile as Profile)
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
          const publicRows = await getCommunityRecipes()
          const publicRecipes = publicRows.map((row) => mapDbRowToRecipe(row))

          setRecipeList([...publicRecipes, ...starterRecipes])
        } catch (error) {
          console.error('Failed to load public community recipes:', error)
          setRecipeList(starterRecipes)
        }

        return
      }

      try {
        const ownRows = await getRecipes(user.id)
        const communityRows = await getCommunityRecipes(user.id)

        const ownRecipes = ownRows.map((row) => mapDbRowToRecipe(row, user.id))

        const communityRecipes = communityRows.map((row) =>
          mapDbRowToRecipe(row, user.id)
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
      } catch (error) {
        console.error('Failed to load recipes from Supabase:', error)

        try {
          const rows = await getRecipes(user.id)
          const mappedRecipes = rows.map((row) =>
            mapDbRowToRecipe(row, user.id)
          )
          setRecipeList([...mappedRecipes, ...starterRecipes])
        } catch {
          setRecipeList(starterRecipes)
        }
      }
    }

    void loadRecipes()
  }, [user])

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
      !showFavoritesOnly ||
      isRecipeFavorited(recipe, sampleFavoriteIds, cloudFavoriteRecipeIds)

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

    navigate('/')
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
      await deleteRecipeById(recipeId, user.id)

      setRecipeList((currentRecipes) =>
        currentRecipes.filter((recipe) => recipe.id !== recipeId)
      )

      setCloudFavoriteRecipeIds((currentIds) =>
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

  async function refreshCloudFavorites(userId: string) {
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
      setFormMessage('Failed to update favorites. Please try again.')
    }
  }

  async function handleToggleFavorite(recipe: Recipe) {
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
      setFormMessage('This recipe cannot be saved to favorites yet. Try refreshing.')
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
      setFormMessage('Failed to update favorites. Please try again.')
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

  function handleViewAuthor(username: string) {
    const trimmed = username?.trim()
    if (!trimmed) return

    setSelectedRecipe(null)
    navigate(`/users/${encodeURIComponent(trimmed)}`)
  }

  if (isStandaloneAuthRoute) {
    return (
      <AuthGate theme={theme} onToggleTheme={handleToggleTheme}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </AuthGate>
    )
  }

  return (
    <AuthGate theme={theme} onToggleTheme={handleToggleTheme}>
      <main className={`app app--${theme}`}>
        <div className="app__container">
          <AppHeader
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onLogout={() => void logout()}
            onStartCreateRecipe={handleStartCreateRecipe}
            savingRecipe={savingRecipe}
            displayName={displayName}
            email={user?.email}
            userInitial={getUserInitial(displayName || user?.email)}
            totalRecipes={allUserRecipes.length}
            favoriteCount={sampleFavoriteIds.length + cloudFavoriteRecipeIds.length}
            averageCalories={averageCalories}
            isLoggedIn={Boolean(user)}
          />

          {formMessage ? (
            <p className="form-message">{formMessage}</p>
          ) : null}

          {showRecipeForm && !isPublicProfileRoute ? (
            <RecipeForm
              key={recipeBeingEdited?.id ?? 'new'}
              initialRecipe={recipeBeingEdited}
              onSaveRecipe={handleAddRecipe}
              onCancel={handleCancelRecipeForm}
            />
          ) : null}

          <ErrorBoundary
            key={location.pathname}
            onError={(error, info) =>
              captureBoundaryError(error, { componentStack: info.componentStack })
            }
          >
          <Routes>
            <Route path="/users/:username" element={<PublicProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/community"
              element={
                <CommunityFeedPage
                  recipes={communityRecipes}
                  sampleRecipes={sampleRecipes}
                  sampleFavoriteIds={sampleFavoriteIds}
                  cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
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
                  onViewAuthor={handleViewAuthor}
                />
              }
            />
            <Route
              path="/"
              element={
                <>
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
                    sampleFavoriteIds={sampleFavoriteIds}
                    cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectRecipe={handleSelectRecipe}
                    onStartCreateRecipe={handleStartCreateRecipe}
                    onToggleLike={handleToggleLike}
                    onViewAuthor={handleViewAuthor}
                  />
                </>
              }
            />
            <Route path="*" element={<NotFoundRoute />} />
          </Routes>
          </ErrorBoundary>

          {selectedRecipe ? (
            <RecipeModal
              recipe={selectedRecipe}
              onClose={handleCloseModal}
              onEdit={handleStartEditRecipe}
              onDelete={handleDeleteRecipe}
              onTogglePublic={handleToggleRecipePublic}
              canManage={canManageSelectedRecipe}
              liked={Boolean(selectedRecipe.liked)}
              likeCount={selectedRecipe.likeCount ?? 0}
              onToggleLike={handleToggleLike}
              onViewAuthor={handleViewAuthor}
            />
          ) : null}
        </div>
      </main>
    </AuthGate>
  )
}

function NotFoundRoute() {
  const navigate = useNavigate()
  return (
    <section className="profile-page__state-screen">
      <p>This page could not be found.</p>
      <button
        type="button"
        className="profile-page__edit-profile-button"
        onClick={() => navigate('/')}
      >
        Back to recipes
      </button>
    </section>
  )
}
