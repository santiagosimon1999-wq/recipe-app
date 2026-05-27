import { lazy, Suspense, useCallback, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router'
import { RecipeShellProvider } from './context/RecipeShellContext'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
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
import {
  type CommunityFeedMode,
  useRecipeMutations,
  useRecipes,
} from './hooks/useRecipes'
import { useUnreadNotifications } from './hooks/useUnreadNotifications'
import RecipeDetailRoute from './components/RecipeDetailRoute'
import { normalizeRecipeForUi } from './lib/recipeMappers'
import { getUserInitial } from './lib/userUtils'
import { notify } from './lib/toast'
import type { Recipe } from './types/Recipe'
import type { Theme } from './hooks/useTheme'

const CommunityFeedPage = lazy(() => import('./pages/CommunityFeedPage'))
const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))

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

  const [communityFeedMode, setCommunityFeedMode] =
    useState<CommunityFeedMode>('all')

  const { displayName } = useProfile(user)
  const unreadNotifications = useUnreadNotifications(user)
  const {
    recipeList,
    setRecipeList,
    likedRecipeIds,
    setLikedRecipeIds,
    hasMoreCommunity,
    loadingMoreCommunity,
    loadMoreCommunity,
    followingFeedRecipes,
  } = useRecipes(user, communityFeedMode)

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
    savoraInspirationRecipes,
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

  const handleSelectRecipe = useCallback(
    (recipe: Recipe) => {
      const normalized = normalizeRecipeForUi(recipe)

      const fromList =
        normalized.id > 0
          ? recipeList.find(
              (item) =>
                item.id > 0 &&
                item.id === normalized.id &&
                (item.source === normalized.source ||
                  (normalized.userId && item.userId === normalized.userId))
            )
          : null

      setSelectedRecipe(
        normalizeRecipeForUi({
          ...normalized,
          likeCount: fromList?.likeCount ?? normalized.likeCount,
          liked: fromList?.liked ?? normalized.liked,
        })
      )
    },
    [recipeList]
  )

  function handleCloseModal() {
    setSelectedRecipe(null)

    if (location.pathname.startsWith('/recipes/')) {
      navigate('/community')
    }
  }

  const handleRecipeFromDeepLink = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe)
  }, [])

  function handleViewAuthor(username: string) {
    const trimmed = username?.trim()
    if (!trimmed) return

    setSelectedRecipe(null)
    navigate(`/users/${encodeURIComponent(trimmed)}`)
  }

  const shellContextValue = {
    onSelectRecipe: handleSelectRecipe,
    onViewAuthor: handleViewAuthor,
  }

  return (
    <RecipeShellProvider value={shellContextValue}>
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
            unreadNotifications={unreadNotifications}
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
              <Route
                path="/recipes/:recipeId"
                element={
                  <RecipeDetailRoute
                    userId={user?.id}
                    onRecipeReady={handleRecipeFromDeepLink}
                  />
                }
              />
              <Route
                path="/users/:username"
                element={
                  <PublicProfilePage onSelectRecipe={handleSelectRecipe} />
                }
              />
              <Route
                path="/profile"
                element={
                  <ProfilePage onSelectRecipe={handleSelectRecipe} />
                }
              />
              <Route path="/following" element={
                <ActivityFeedPage
                  recipes={followingFeedRecipes}
                  sampleFavoriteIds={sampleFavoriteIds}
                  cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
                  onToggleFavorite={toggleFavorite}
                  onSelectRecipe={handleSelectRecipe}
                  onToggleLike={toggleLike}
                  onViewAuthor={handleViewAuthor}
                  isLoggedIn={Boolean(user)}
                />
              } />
              <Route
                path="/search"
                element={
                  <SearchPage
                    userId={user?.id}
                    sampleFavoriteIds={sampleFavoriteIds}
                    cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
                    onToggleFavorite={toggleFavorite}
                    onSelectRecipe={handleSelectRecipe}
                    onToggleLike={toggleLike}
                    onViewAuthor={handleViewAuthor}
                  />
                }
              />
              <Route
                path="/collections"
                element={
                  <CollectionsPage onSelectRecipe={handleSelectRecipe} />
                }
              />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route
                path="/community"
                element={
                  <CommunityFeedPage
                    recipes={communityRecipes}
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
                    communityFeedMode={communityFeedMode}
                    onCommunityFeedModeChange={setCommunityFeedMode}
                    isLoggedIn={Boolean(user)}
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
                      savoraInspirationRecipes={savoraInspirationRecipes}
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
    </RecipeShellProvider>
  )
}

function RouteFallback({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/users/') || pathname === '/profile') {
    return <ProfilePageSkeleton />
  }

  if (
    pathname === '/community' ||
    pathname === '/following' ||
    pathname === '/search' ||
    pathname === '/'
  ) {
    return <RecipeGridSkeleton count={6} />
  }

  if (pathname.startsWith('/recipes/')) {
    return (
      <section className="profile-page__state-screen" aria-busy="true">
        <p>Opening recipe…</p>
      </section>
    )
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
