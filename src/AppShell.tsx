import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router'
import { RecipeShellProvider } from './context/RecipeShellContext'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { captureBoundaryError } from './lib/sentry'
import { useConfirm } from './context/ConfirmProvider'
import { useAuth } from './context/useAuth'
import AppFooter from './components/AppFooter'
import AppHeader from './components/AppHeader'
import { isFullHeroRoute } from './lib/headerRoutes'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import DiscoverPanel from './components/DiscoverPanel'
import RecipeDashboard from './components/RecipeDashboard'
import RecipeForm from './components/RecipeForm'
import RecipeModal from './components/RecipeModal'
import { RecipeGridSkeleton } from './components/ui/RecipeCardSkeleton'
import { ProfilePageSkeleton } from './components/ui/ProfilePageSkeleton'
import { useSaved } from './hooks/useFavorites'
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
import {
  HOME_COMMUNITY_PREVIEW_LIMIT,
  HOME_INSPIRATION_PREVIEW_LIMIT,
  HOME_SAVED_PREVIEW_LIMIT,
} from './lib/homeDashboard'
import { isSavoraTeamRecipe } from './lib/savoraTeam'
import { isRecipeSaved } from './utils/favorites'
import { normalizeRecipeForUi } from './lib/recipeMappers'
import { getCategoryRegistry } from './lib/recipeService'
import { getUserInitial } from './lib/userUtils'
import { notify } from './lib/toast'
import type { CategoryGroupKey } from './types/Category'
import type { Recipe } from './types/Recipe'
import type { Theme } from './hooks/useTheme'
import {
  CATEGORY_REGISTRY,
  groupCategoryOptions,
  type CategoryOption,
} from './utils/categories'

const CommunityFeedPage = lazy(() => import('./pages/CommunityFeedPage'))
const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage'))
const CreatorDashboardPage = lazy(() => import('./pages/CreatorDashboardPage'))
const FollowListPage = lazy(() => import('./pages/FollowListPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SavedRecipesPage = lazy(() => import('./pages/SavedRecipesPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'))
const WhatsNewPage = lazy(() => import('./pages/WhatsNewPage'))

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
  const [categoryOptions, setCategoryOptions] = useState<
    Record<CategoryGroupKey, CategoryOption[]>
  >(() => groupCategoryOptions(CATEGORY_REGISTRY))

  const { displayName } = useProfile(user)
  const unreadNotifications = useUnreadNotifications(user)

  const {
    recipeList,
    setRecipeList,
    likedRecipeIds,
    setLikedRecipeIds,
    likeCountsByRecipeId,
    setLikeCountsByRecipeId,
    hasMoreCommunity,
    loadingMoreCommunity,
    loadMoreCommunity,
  } = useRecipes(user, communityFeedMode)

  const {
    cloudSavedRecipeIds,
    sampleSavedRecipeIds,
    savedCount,
    toggleSaved,
    removeCloudSavedRecipeId,
  } = useSaved(user, recipeList)

  const homeFilters = useRecipeFilters(
    recipeList,
    sampleSavedRecipeIds,
    cloudSavedRecipeIds,
  )
  const communityFilters = useRecipeFilters(
    recipeList,
    sampleSavedRecipeIds,
    cloudSavedRecipeIds,
  )

  const {
    allUserRecipes,
    averageCalories,
  } = homeFilters

  const homeUserRecipes = useMemo(
    () =>
      recipeList.filter(
        (recipe) =>
          recipe.source === 'user' && !isSavoraTeamRecipe(recipe),
      ),
    [recipeList],
  )

  const homeCommunityPreview = useMemo(
    () =>
      homeFilters.communityRecipes.slice(0, HOME_COMMUNITY_PREVIEW_LIMIT),
    [homeFilters.communityRecipes],
  )

  const homeInspirationPreview = useMemo(
    () =>
      homeFilters.savoraInspirationRecipes.slice(
        0,
        HOME_INSPIRATION_PREVIEW_LIMIT,
      ),
    [homeFilters.savoraInspirationRecipes],
  )

  const savedRecipesPreview = useMemo(
    () =>
      recipeList
        .filter((recipe) =>
          isRecipeSaved(recipe, sampleSavedRecipeIds, cloudSavedRecipeIds),
        )
        .slice(0, HOME_SAVED_PREVIEW_LIMIT),
    [recipeList, sampleSavedRecipeIds, cloudSavedRecipeIds],
  )

  const homePreviewCount =
    homeCommunityPreview.length + homeInspirationPreview.length

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [recipeBeingEdited, setRecipeBeingEdited] = useState<Recipe | null>(null)
  const [savingRecipe, setSavingRecipe] = useState(false)

  const { toggleLike } = useLikes({
    user,
    recipeList,
    setRecipeList,
    likeCountsByRecipeId,
    setLikeCountsByRecipeId,
    selectedRecipe,
    setSelectedRecipe,
    likedRecipeIds,
    setLikedRecipeIds,
  })

  const { saveRecipe, deleteRecipe, toggleRecipePublic } = useRecipeMutations(
    user,
    setRecipeList,
    removeCloudSavedRecipeId
  )

  const canManageSelectedRecipe = !!user && selectedRecipe?.source === 'user'

  const mergeLikeCounts = useCallback(
    (likeCounts: Record<number, number>) => {
      const entries = Object.entries(likeCounts)
      if (entries.length === 0) return

      setLikeCountsByRecipeId((current) => {
        const next = { ...current }
        for (const [recipeId, likeCount] of entries) {
          const parsedId = Number(recipeId)
          if (!Number.isFinite(parsedId) || parsedId <= 0) continue
          next[parsedId] = likeCount
        }
        return next
      })
    },
    [setLikeCountsByRecipeId]
  )

  const mergeLikedRecipeIds = useCallback(
    (recipeIds: number[]) => {
      if (recipeIds.length === 0) return
      setLikedRecipeIds((current) => [...new Set([...current, ...recipeIds])])
    },
    [setLikedRecipeIds]
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const registry = await getCategoryRegistry()
        if (cancelled || registry.length === 0) return

        setCategoryOptions(
          groupCategoryOptions(
            registry.map((item) => ({
              name: item.name,
              slug: item.slug,
              icon: item.icon ?? '',
              groupKey: item.groupKey,
              groupLabel: item.groupLabel,
            }))
          )
        )
      } catch {
        // Keep static fallback registry.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

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
          likeCount:
            likeCountsByRecipeId[normalized.id] ??
            fromList?.likeCount ??
            normalized.likeCount,
          liked:
            likedRecipeIds.includes(normalized.id) ||
            fromList?.liked ||
            normalized.liked,
        })
      )
    },
    [recipeList, likedRecipeIds, likeCountsByRecipeId]
  )

  function handleCloseModal() {
    setSelectedRecipe(null)

    if (location.pathname.startsWith('/recipes/')) {
      navigate('/community')
    }
  }

  const handleRecipeFromDeepLink = useCallback(
    (recipe: Recipe) => {
      if (recipe.id > 0 && recipe.source !== 'sample') {
        setLikeCountsByRecipeId((current) => ({
          ...current,
          [recipe.id]: recipe.likeCount ?? current[recipe.id] ?? 0,
        }))
        setLikedRecipeIds((current) => {
          const withoutRecipeId = current.filter((id) => id !== recipe.id)
          return recipe.liked ? [...withoutRecipeId, recipe.id] : withoutRecipeId
        })
      }

      setSelectedRecipe(
        normalizeRecipeForUi({
          ...recipe,
          likeCount: recipe.likeCount ?? 0,
          liked: recipe.liked,
        })
      )
    },
    [setLikeCountsByRecipeId, setLikedRecipeIds]
  )

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
            variant={isFullHeroRoute(location.pathname) ? 'full' : 'compact'}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onLogout={() => void logout()}
            onStartCreateRecipe={handleStartCreateRecipe}
            savingRecipe={savingRecipe}
            displayName={displayName}
            email={user?.email}
            userInitial={getUserInitial(displayName || user?.email)}
            totalRecipes={allUserRecipes.length}
            savedCount={savedCount}
            averageCalories={averageCalories}
            isLoggedIn={Boolean(user)}
            unreadNotifications={unreadNotifications}
          />

        {showRecipeForm && !isPublicProfileRoute ? (
          <RecipeForm
            key={recipeBeingEdited?.id ?? 'new'}
            initialRecipe={recipeBeingEdited}
            categoryOptions={categoryOptions}
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
                    onMergeLikeCounts={mergeLikeCounts}
                    onMergeLikedRecipeIds={mergeLikedRecipeIds}
                  />
                }
              />
              <Route
                path="/users/:username"
                element={
                  <PublicProfilePage
                    userId={user?.id}
                    onSelectRecipe={handleSelectRecipe}
                    onMergeLikeCounts={mergeLikeCounts}
                    onMergeLikedRecipeIds={mergeLikedRecipeIds}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <ProfilePage onSelectRecipe={handleSelectRecipe} />
                }
              />
              <Route
                path="/profile/followers"
                element={<FollowListPage mode="followers" />}
              />
              <Route
                path="/profile/following"
                element={<FollowListPage mode="following" />}
              />
              <Route path="/creator" element={<CreatorDashboardPage />} />
              <Route path="/following" element={<ActivityFeedPage />} />
              <Route
                path="/search"
                element={
                  <SearchPage
                    userId={user?.id}
                    likedRecipeIds={likedRecipeIds}
                    likeCountsByRecipeId={likeCountsByRecipeId}
                    sampleSavedRecipeIds={sampleSavedRecipeIds}
                    cloudSavedRecipeIds={cloudSavedRecipeIds}
                    categoryOptions={categoryOptions}
                    onToggleSaved={toggleSaved}
                    onSelectRecipe={handleSelectRecipe}
                    onToggleLike={toggleLike}
                    onViewAuthor={handleViewAuthor}
                    onMergeLikeCounts={mergeLikeCounts}
                    onMergeLikedRecipeIds={mergeLikedRecipeIds}
                  />
                }
              />
              <Route
                path="/saved"
                element={
                  <SavedRecipesPage
                    userId={user?.id}
                    sampleSavedRecipeIds={sampleSavedRecipeIds}
                    cloudSavedRecipeIds={cloudSavedRecipeIds}
                    likedRecipeIds={likedRecipeIds}
                    likeCountsByRecipeId={likeCountsByRecipeId}
                    onToggleSaved={toggleSaved}
                    onSelectRecipe={handleSelectRecipe}
                    onToggleLike={toggleLike}
                    onViewAuthor={handleViewAuthor}
                    onMergeLikeCounts={mergeLikeCounts}
                    onMergeLikedRecipeIds={mergeLikedRecipeIds}
                  />
                }
              />
              <Route
                path="/collections"
                element={
                  <CollectionsPage
                    userId={user?.id}
                    onSelectRecipe={handleSelectRecipe}
                    onMergeLikeCounts={mergeLikeCounts}
                    onMergeLikedRecipeIds={mergeLikedRecipeIds}
                  />
                }
              />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/whats-new" element={<WhatsNewPage />} />
              <Route
                path="/community"
                element={
                  <CommunityFeedPage
                    recipes={communityFilters.communityRecipes}
                    sampleSavedRecipeIds={sampleSavedRecipeIds}
                    cloudSavedRecipeIds={cloudSavedRecipeIds}
                    searchTerm={communityFilters.searchTerm}
                    selectedCategories={communityFilters.selectedCategories}
                    categoryOptions={categoryOptions}
                    showSavedOnly={communityFilters.showSavedOnly}
                    showClearFiltersButton={communityFilters.showClearFiltersButton}
                    onSearchChange={communityFilters.setSearchTerm}
                    onCategoryToggle={communityFilters.handleCategoryToggle}
                    onToggleShowSavedOnly={communityFilters.handleToggleShowSavedOnly}
                    onClearFilters={communityFilters.handleClearFilters}
                    onToggleSaved={toggleSaved}
                    onSelectRecipe={handleSelectRecipe}
                    onToggleLike={toggleLike}
                    onViewAuthor={handleViewAuthor}
                    likedRecipeIds={likedRecipeIds}
                    likeCountsByRecipeId={likeCountsByRecipeId}
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
                      variant="home"
                      searchTerm={homeFilters.searchTerm}
                      selectedCategories={homeFilters.selectedCategories}
                      categoryOptions={categoryOptions}
                      showSavedOnly={homeFilters.showSavedOnly}
                      showClearFiltersButton={homeFilters.showClearFiltersButton}
                      onSearchChange={homeFilters.setSearchTerm}
                      onCategoryToggle={homeFilters.handleCategoryToggle}
                      onToggleShowSavedOnly={homeFilters.handleToggleShowSavedOnly}
                      onClearFilters={homeFilters.handleClearFilters}
                      resultCount={
                        homePreviewCount > 0 ? homePreviewCount : undefined
                      }
                    />

                    <RecipeDashboard
                      userRecipes={homeUserRecipes}
                      communityPreview={homeCommunityPreview}
                      savoraInspirationPreview={homeInspirationPreview}
                      savedRecipesPreview={savedRecipesPreview}
                      sampleSavedRecipeIds={sampleSavedRecipeIds}
                      cloudSavedRecipeIds={cloudSavedRecipeIds}
                      isLoggedIn={Boolean(user)}
                      onToggleSaved={toggleSaved}
                      onSelectRecipe={handleSelectRecipe}
                      onStartCreateRecipe={handleStartCreateRecipe}
                      onToggleLike={toggleLike}
                      onViewAuthor={handleViewAuthor}
                      likedRecipeIds={likedRecipeIds}
                      likeCountsByRecipeId={likeCountsByRecipeId}
                      onEdit={handleStartEditRecipe}
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
            liked={likedRecipeIds.includes(selectedRecipe.id)}
            likeCount={
              likeCountsByRecipeId[selectedRecipe.id] ?? selectedRecipe.likeCount ?? 0
            }
            isSaved={isRecipeSaved(
              selectedRecipe,
              sampleSavedRecipeIds,
              cloudSavedRecipeIds,
            )}
            onToggleSaved={toggleSaved}
            onToggleLike={toggleLike}
            onViewAuthor={handleViewAuthor}
          />
        ) : null}

          <AppFooter />
        </div>

        <BottomNav
          isLoggedIn={Boolean(user)}
          unreadNotifications={unreadNotifications}
          onStartCreateRecipe={handleStartCreateRecipe}
        />

        <InstallPrompt />
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
    pathname === '/creator' ||
    pathname === '/profile/followers' ||
    pathname === '/profile/following' ||
    pathname === '/following' ||
    pathname === '/saved' ||
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
