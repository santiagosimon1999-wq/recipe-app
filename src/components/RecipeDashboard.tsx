import type { Recipe } from '../types/Recipe'
import RecipeSection from './RecipeSection'

type RecipeDashboardProps = {
  userRecipes: Recipe[]
  communityRecipes: Recipe[]
  savoraInspirationRecipes: Recipe[]
  sampleSavedRecipeIds: number[]
  cloudSavedRecipeIds: number[]
  likedRecipeIds?: number[]
  likeCountsByRecipeId?: Record<number, number>
  onToggleSaved: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onStartCreateRecipe: () => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
}

export default function RecipeDashboard({
  userRecipes,
  communityRecipes,
  savoraInspirationRecipes,
  sampleSavedRecipeIds,
  cloudSavedRecipeIds,
  likedRecipeIds,
  likeCountsByRecipeId,
  onToggleSaved,
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
          countLabel="recipes"
          recipes={userRecipes}
          sampleSavedRecipeIds={sampleSavedRecipeIds}
          cloudSavedRecipeIds={cloudSavedRecipeIds}
          likedRecipeIds={likedRecipeIds}
          likeCountsByRecipeId={likeCountsByRecipeId}
          onToggleSaved={onToggleSaved}
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
        sampleSavedRecipeIds={sampleSavedRecipeIds}
        cloudSavedRecipeIds={cloudSavedRecipeIds}
        likedRecipeIds={likedRecipeIds}
        likeCountsByRecipeId={likeCountsByRecipeId}
        onToggleSaved={onToggleSaved}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
      />

      {savoraInspirationRecipes.length > 0 ? (
        <RecipeSection
          eyebrow="Savora inspiration"
          title="Explore Recipes"
          countLabel="ideas"
          recipes={savoraInspirationRecipes}
          sampleSavedRecipeIds={sampleSavedRecipeIds}
          cloudSavedRecipeIds={cloudSavedRecipeIds}
          likedRecipeIds={likedRecipeIds}
          likeCountsByRecipeId={likeCountsByRecipeId}
          onToggleSaved={onToggleSaved}
          onSelectRecipe={onSelectRecipe}
          onToggleLike={onToggleLike}
          onViewAuthor={onViewAuthor}
        />
      ) : null}
    </>
  )
}
