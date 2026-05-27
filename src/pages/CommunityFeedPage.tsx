import type { Recipe } from '../types/Recipe'
import DiscoverPanel from '../components/DiscoverPanel'
import RecipeGrid from '../components/RecipeGrid'

type CommunityFeedPageProps = {
  recipes: Recipe[]
  sampleRecipes: Recipe[]
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
}

export default function CommunityFeedPage({
  recipes,
  sampleRecipes,
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
}: CommunityFeedPageProps) {
  const showFallback = recipes.length === 0 && sampleRecipes.length > 0
  const feedRecipes = recipes.length > 0 ? recipes : sampleRecipes

  return (
    <section className="recipe-section community-feed-page">
      <div className="recipe-section__header">
        <div>
          <p className="app-eyebrow">Community feed</p>
          <h2>Public recipes from the community</h2>
        </div>
        <span>{feedRecipes.length} items</span>
      </div>

      <p className="community-feed__intro">
        Browse recipes that people have shared publicly. Sign in to share your own
        recipes and help the community discover new meal ideas.
      </p>

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

      <RecipeGrid
        recipes={feedRecipes}
        sampleFavoriteIds={sampleFavoriteIds}
        cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
      />

      {showFallback ? (
        <p className="community-feed__hint">
          No community recipes have been shared yet, so we're showing sample
          inspiration for now.
        </p>
      ) : null}
    </section>
  )
}
