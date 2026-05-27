import type { CommunityFeedMode } from '../hooks/useRecipes'
import type { Recipe } from '../types/Recipe'
import DiscoverPanel from '../components/DiscoverPanel'
import RecipeGrid from '../components/RecipeGrid'

type CommunityFeedPageProps = {
  recipes: Recipe[]
  sampleFavoriteIds: number[]
  cloudFavoriteRecipeIds: number[]
  searchTerm: string
  selectedCategory: string
  showFavoritesOnly: boolean
  showClearFiltersButton: boolean
  onSearchChange: (searchTerm: string) => void
  onCategoryChange: (category: string) => void
  onToggleShowFavoritesOnly: () => void
  onClearFilters: () => void
  onToggleFavorite: (recipe: Recipe) => void
  onToggleLike?: (recipeId: number) => void
  onSelectRecipe: (recipe: Recipe) => void
  onViewAuthor?: (username: string) => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  communityFeedMode?: CommunityFeedMode
  onCommunityFeedModeChange?: (mode: CommunityFeedMode) => void
  isLoggedIn?: boolean
}

export default function CommunityFeedPage({
  recipes,
  sampleFavoriteIds,
  cloudFavoriteRecipeIds,
  searchTerm,
  selectedCategory,
  showFavoritesOnly,
  showClearFiltersButton,
  onSearchChange,
  onCategoryChange,
  onToggleShowFavoritesOnly,
  onClearFilters,
  onToggleFavorite,
  onToggleLike,
  onSelectRecipe,
  onViewAuthor,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  communityFeedMode = 'all',
  onCommunityFeedModeChange,
  isLoggedIn = false,
}: CommunityFeedPageProps) {
  const showLoadMore = Boolean(onLoadMore) && recipes.length > 0 && hasMore

  return (
    <section className="recipe-section community-feed-page">
      <div className="recipe-section__header">
        <div>
          <p className="app-eyebrow">Community feed</p>
          <h2>Public recipes from the community</h2>
        </div>
        <span>{recipes.length} items</span>
      </div>

      <p className="community-feed__intro">
        Browse recipes that people have shared publicly. Sign in to share your own
        recipes and help the community discover new meal ideas.
      </p>

      {isLoggedIn && onCommunityFeedModeChange ? (
        <div
          className="community-feed__mode-toggle"
          role="group"
          aria-label="Community feed filter"
        >
          <button
            type="button"
            className={
              communityFeedMode === 'all'
                ? 'community-feed__mode-button community-feed__mode-button--active'
                : 'community-feed__mode-button'
            }
            onClick={() => onCommunityFeedModeChange('all')}
          >
            Everyone
          </button>
          <button
            type="button"
            className={
              communityFeedMode === 'following'
                ? 'community-feed__mode-button community-feed__mode-button--active'
                : 'community-feed__mode-button'
            }
            onClick={() => onCommunityFeedModeChange('following')}
          >
            Following
          </button>
        </div>
      ) : null}

      {communityFeedMode === 'following' && isLoggedIn && recipes.length === 0 ? (
        <p className="community-feed__hint">
          Follow chefs from their public profiles to see their recipes here.
        </p>
      ) : null}

      <DiscoverPanel
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        showFavoritesOnly={showFavoritesOnly}
        showClearFiltersButton={showClearFiltersButton}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
        onToggleShowFavoritesOnly={onToggleShowFavoritesOnly}
        onClearFilters={onClearFilters}
      />

      {recipes.length === 0 ? (
        <p className="community-feed__hint">
          No community recipes have been shared yet. Publish a public recipe or
          ask your admin to seed @savora-team inspiration recipes.
        </p>
      ) : null}

      <RecipeGrid
        recipes={recipes}
        sampleFavoriteIds={sampleFavoriteIds}
        cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
      />

      {showLoadMore ? (
        <div className="community-feed__load-more">
          <button
            type="button"
            className="profile-page__edit-profile-button"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-busy={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more recipes'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
