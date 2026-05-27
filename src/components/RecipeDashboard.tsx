import type { Recipe } from '../types/Recipe'
import RecipeSection from './RecipeSection'

type RecipeDashboardProps = {
  userRecipes: Recipe[]
  communityRecipes: Recipe[]
  sampleRecipes: Recipe[]
  sampleFavoriteIds: number[]
  cloudFavoriteRecipeIds: number[]
  onToggleFavorite: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onStartCreateRecipe: () => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
}

export default function RecipeDashboard({
  userRecipes,
  communityRecipes,
  sampleRecipes,
  sampleFavoriteIds,
  cloudFavoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
  onStartCreateRecipe,
  onToggleLike,
  onViewAuthor,
}: RecipeDashboardProps) {
  return (
    <>
      {userRecipes.length > 0 ? (
        <RecipeSection
          eyebrow="Your kitchen"
          title="Your Recipes"
          countLabel="saved"
          recipes={userRecipes}
          sampleFavoriteIds={sampleFavoriteIds}
          cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
          onToggleFavorite={onToggleFavorite}
          onSelectRecipe={onSelectRecipe}
          onToggleLike={onToggleLike}
          onViewAuthor={onViewAuthor}
        />
      ) : (
        <section className="empty-profile-state">
          <h2>Your recipe board is empty</h2>
          <p>
            Create your first recipe with ingredients, macros, instructions,
            and a real image.
          </p>
          <button type="button" onClick={onStartCreateRecipe}>
            Create your first recipe
          </button>
        </section>
      )}

      <RecipeSection
        eyebrow="Community feed"
        title="Shared Recipes"
        countLabel="shared"
        recipes={communityRecipes}
        sampleFavoriteIds={sampleFavoriteIds}
        cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
      />

      <RecipeSection
        eyebrow="Community inspiration"
        title="Explore Recipes"
        countLabel="ideas"
        recipes={sampleRecipes}
        sampleFavoriteIds={sampleFavoriteIds}
        cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
      />
    </>
  )
}
