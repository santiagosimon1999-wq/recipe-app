import { lazy, Suspense, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { captureBoundaryError } from './lib/sentry'
import { useConfirm } from './context/ConfirmProvider'
import { useAuth } from './context/useAuth'
import AppHeader from './components/AppHeader'
import DiscoverPanel from './components/DiscoverPanel'
import RecipeDashboard from './components/RecipeDashboard'
import RecipeForm from './components/RecipeForm'
import RecipeModal from './components/RecipeModal'
import { RecipeGridSkeleton } from './components/ui/RecipeCardSkeleton'
import { ProfilePageSkeleton } from './components/ui/ProfilePageSkeleton'
import { useFavorites } from './hooks/useFavorites'
import { useLikes } from './hooks/useLikes'
import { useProfile } from './hooks/useProfile'
import { useRecipeFilters } from './hooks/useRecipeFilters'
import { useRecipeMutations, useRecipes } from './hooks/useRecipes'
import { getUserInitial } from './lib/userUtils'
import { notify } from './lib/toast'
import type { Recipe } from './types/Recipe'
import type { Theme } from './hooks/useTheme'

const CommunityFeedPage = lazy(() => import('./pages/CommunityFeedPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'))

type AppShellProps = {
  theme: Theme
  onToggleTheme: () => void
}

export default function AppShell({ theme, onToggleTheme }: AppShellProps) {
  const { logout, user } = useAuth()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const location = useLocation()
  const isPublicProfileRoute = location.pathname.startsWith('/users/')

  const { displayName } = useProfile(user)
  const {
    recipeList,
    setRecipeList,
    likedRecipeIds,
    setLikedRecipeIds,
    hasMoreCommunity,
    loadingMoreCommunity,
    loadMoreCommunity,
  } = useRecipes(user)

  const {
    cloudFavoriteRecipeIds,
    sampleFavoriteIds,
    favoriteCount,
    toggleFavorite,
    removeCloudFavorite,
  } = useFavorites(user, recipeList)

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    userRecipes,
    communityRecipes,
    sampleRecipes,
    allUserRecipes,
    averageCalories,
    showClearFiltersButton,
    handleClearFilters,
    handleToggleShowFavoritesOnly,
  } = useRecipeFilters(recipeList, sampleFavoriteIds, cloudFavoriteRecipeIds)

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [recipeBeingEdited, setRecipeBeingEdited] = useState<Recipe | null>(null)
  const [savingRecipe, setSavingRecipe] = useState(false)

  const { toggleLike } = useLikes({
    user,
    recipeList,
    setRecipeList,
    selectedRecipe,
    setSelectedRecipe,
    likedRecipeIds,
    setLikedRecipeIds,
  })

  const { saveRecipe, deleteRecipe, toggleRecipePublic } = useRecipeMutations(
    user,
    setRecipeList,
    removeCloudFavorite
  )

  const canManageSelectedRecipe = !!user && selectedRecipe?.source === 'user'

  async function handleAddRecipe(recipeData: Recipe) {
    await saveRecipe({
      recipeData,
      recipeBeingEdited,
      savingRecipe,
      setSavingRecipe,
      setShowRecipeForm,
      setRecipeBeingEdited,
      setSelectedRecipe,
    })
  }

  function handleStartCreateRecipe() {
    if (!user) return

    navigate('/')
    setRecipeBeingEdited(null)
    setShowRecipeForm(true)
    setSelectedRecipe(null)
  }

  function handleStartEditRecipe(recipe: Recipe) {
    if (!user) return

    if (recipe.source !== 'user') {
      notify.error('Only your own recipes can be edited.')
      return
    }

    setRecipeBeingEdited(recipe)
    setShowRecipeForm(true)
    setSelectedRecipe(null)
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
      return
    }

    const confirmed = await confirm({
      title: 'Delete recipe?',
      message: `Delete "${recipeToDelete?.title ?? 'this recipe'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    })

    if (!confirmed) return

    await deleteRecipe(
      recipeId,
      recipeList,
      selectedRecipe,
      recipeBeingEdited,
      setSelectedRecipe,
      setRecipeBeingEdited,
      setShowRecipeForm
    )
  }

  async function handleToggleRecipePublic(recipe: Recipe) {
    await toggleRecipePublic(recipe, setSelectedRecipe)
  }

  function handleSelectRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe)
  }

  function handleCloseModal() {
    setSelectedRecipe(null)
  }

  function handleViewAuthor(username: string) {
    const trimmed = username?.trim()
    if (!trimmed) return

    setSelectedRecipe(null)
    navigate(`/users/${encodeURIComponent(trimmed)}`)
  }

  return (
    <main className={`app app--${theme}`}>
      <div className="app__container">
        <AppHeader
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={() => void logout()}
          onStartCreateRecipe={handleStartCreateRecipe}
          savingRecipe={savingRecipe}
          displayName={displayName}
          email={user?.email}
          userInitial={getUserInitial(displayName || user?.email)}
          totalRecipes={allUserRecipes.length}
          favoriteCount={favoriteCount}
          averageCalories={averageCalories}
          isLoggedIn={Boolean(user)}
        />

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
          <Suspense fallback={<RouteFallback pathname={location.pathname} />}>
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
                    onToggleFavorite={toggleFavorite}
                    onSelectRecipe={handleSelectRecipe}
                    onToggleLike={toggleLike}
                    onViewAuthor={handleViewAuthor}
                    hasMore={hasMoreCommunity}
                    loadingMore={loadingMoreCommunity}
                    onLoadMore={() => void loadMoreCommunity()}
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
                      onToggleFavorite={toggleFavorite}
                      onSelectRecipe={handleSelectRecipe}
                      onStartCreateRecipe={handleStartCreateRecipe}
                      onToggleLike={toggleLike}
                      onViewAuthor={handleViewAuthor}
                    />
                  </>
                }
              />
              <Route path="*" element={<NotFoundRoute />} />
            </Routes>
          </Suspense>
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
            onToggleLike={toggleLike}
            onViewAuthor={handleViewAuthor}
          />
        ) : null}
      </div>
    </main>
  )
}

function RouteFallback({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/users/') || pathname === '/profile') {
    return <ProfilePageSkeleton />
  }

  if (pathname === '/community' || pathname === '/') {
    return <RecipeGridSkeleton count={6} />
  }

  return (
    <section className="profile-page__state-screen" aria-busy="true">
      <p>Loading…</p>
    </section>
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
