import type { CommunityFeedMode } from '../hooks/useRecipes'
import type { CategoryGroupKey } from '../types/Category'
import type { Recipe } from '../types/Recipe'
import DiscoverPanel from '../components/DiscoverPanel'
import RecipeGrid from '../components/RecipeGrid'
import type { CategoryOption } from '../utils/categories'

type CommunityFeedPageProps = {
  recipes: Recipe[]
  sampleSavedRecipeIds: number[]
  cloudSavedRecipeIds: number[]
  likedRecipeIds?: number[]
  likeCountsByRecipeId?: Record<number, number>
  searchTerm: string
  selectedCategories: string[]
  categoryOptions?: Record<CategoryGroupKey, CategoryOption[]>
  showSavedOnly: boolean
  showClearFiltersButton: boolean
  onSearchChange: (searchTerm: string) => void
  onCategoryToggle: (category: string) => void
  onToggleShowSavedOnly: () => void
  onClearFilters: () => void
  onToggleSaved: (recipe: Recipe) => void
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
  sampleSavedRecipeIds,
  cloudSavedRecipeIds,
  likedRecipeIds,
  likeCountsByRecipeId,
  searchTerm,
  selectedCategories,
  categoryOptions,
  showSavedOnly,
  showClearFiltersButton,
  onSearchChange,
  onCategoryToggle,
  onToggleShowSavedOnly,
  onClearFilters,
  onToggleSaved,
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
          <p className="app-eyebrow">Community</p>
          <h2>See what the Savora community is cooking</h2>
        </div>
        <span>{recipes.length} items</span>
      </div>

      <p className="community-feed__intro" data-testid="community-feed-intro">
        Discover public recipes, follow creators, and join the conversation.
        {isLoggedIn
          ? ' Switch to Following to see recipes from chefs you follow.'
          : ' Sign in to like, save, comment, and share your own recipes.'}
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
        selectedCategories={selectedCategories}
        categoryOptions={categoryOptions}
        showSavedOnly={showSavedOnly}
        showClearFiltersButton={showClearFiltersButton}
        onSearchChange={onSearchChange}
        onCategoryToggle={onCategoryToggle}
        onToggleShowSavedOnly={onToggleShowSavedOnly}
        onClearFilters={onClearFilters}
      />

      {recipes.length === 0 ? (
        <p className="community-feed__hint">
          No public recipes match your filters yet. Try a broader search, clear
          filters, or check back as more creators share their dishes.
        </p>
      ) : null}

      <RecipeGrid
        recipes={recipes}
        sampleSavedRecipeIds={sampleSavedRecipeIds}
        cloudSavedRecipeIds={cloudSavedRecipeIds}
        likedRecipeIds={likedRecipeIds}
        likeCountsByRecipeId={likeCountsByRecipeId}
        onToggleSaved={onToggleSaved}
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
