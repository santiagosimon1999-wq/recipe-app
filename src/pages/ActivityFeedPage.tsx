import type { Recipe } from '../types/Recipe'
import RecipeGrid from '../components/RecipeGrid'

type ActivityFeedPageProps = {
  recipes: Recipe[]
  sampleFavoriteIds: number[]
  cloudFavoriteRecipeIds: number[]
  onToggleFavorite: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
  isLoggedIn: boolean
}

export default function ActivityFeedPage({
  recipes,
  sampleFavoriteIds,
  cloudFavoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
  onToggleLike,
  onViewAuthor,
  isLoggedIn,
}: ActivityFeedPageProps) {
  return (
    <section className="recipe-section community-feed-page">
      <div className="recipe-section__header">
        <div>
          <p className="app-eyebrow">Following</p>
          <h2>Recipes from chefs you follow</h2>
        </div>
        <span>{recipes.length} items</span>
      </div>

      {!isLoggedIn ? (
        <p className="community-feed__intro">
          Sign in to follow other chefs and see their latest public recipes here.
        </p>
      ) : recipes.length === 0 ? (
        <p className="community-feed__intro">
          You are not following anyone yet, or they have not shared public recipes.
          Visit community profiles and tap Follow to build your feed.
        </p>
      ) : (
        <p className="community-feed__intro">
          Fresh public recipes from people you follow, newest first.
        </p>
      )}

      <RecipeGrid
        recipes={recipes}
        sampleFavoriteIds={sampleFavoriteIds}
        cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
      />
    </section>
  )
}
