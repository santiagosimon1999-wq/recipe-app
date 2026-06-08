import type { Recipe } from '../types/Recipe'
import AuthPromptCard from './AuthPromptCard'
import RecipeSection from './RecipeSection'
import { useAuthNavigation } from '../hooks/useAuthNavigation'

type RecipeDashboardProps = {
  userRecipes: Recipe[]
  communityRecipes: Recipe[]
  savoraInspirationRecipes: Recipe[]
  sampleSavedRecipeIds: number[]
  cloudSavedRecipeIds: number[]
  likedRecipeIds?: number[]
  likeCountsByRecipeId?: Record<number, number>
  isLoggedIn: boolean
  onToggleSaved: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onStartCreateRecipe: () => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
  onEdit?: (recipe: Recipe) => void
}

export default function RecipeDashboard({
  userRecipes,
  communityRecipes,
  savoraInspirationRecipes,
  sampleSavedRecipeIds,
  cloudSavedRecipeIds,
  likedRecipeIds,
  likeCountsByRecipeId,
  isLoggedIn,
  onToggleSaved,
  onSelectRecipe,
  onStartCreateRecipe,
  onToggleLike,
  onViewAuthor,
  onEdit,
}: RecipeDashboardProps) {
  const { goToLogin, goToSignUp } = useAuthNavigation()

  return (
    <>
      {isLoggedIn ? (
        userRecipes.length > 0 ? (
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
            onEdit={onEdit}
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
        )
      ) : (
        <section className="empty-profile-state empty-profile-state--guest">
          <h2>Your personal recipe board lives here</h2>
          <p>
            Sign up to save favorites, publish your own recipes, and track what
            you cook.
          </p>
          <p className="empty-profile-state__guest-hint guest-cta-mobile-only">
            Create your free account from the hero above when you are ready.
          </p>
          <div className="guest-cta-desktop-only">
            <AuthPromptCard
              compact
              message="Create a free account to build your recipe collection."
              onLogin={() => goToLogin()}
              onSignUp={() =>
                goToSignUp('Create a free account to build your recipe collection.')
              }
            />
          </div>
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
