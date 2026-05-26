import type { Recipe } from '../types/Recipe'
import RecipeSection from './RecipeSection'
import RecipeModal from './RecipeModal'

type RecipeDashboardProps = {
  userRecipes: Recipe[]
  communityRecipes: Recipe[]
  sampleRecipes: Recipe[]
  favoriteRecipeIds: number[]
  onToggleFavorite: (recipeId: number) => void
  onSelectRecipe: (recipe: Recipe) => void
  onStartCreateRecipe: () => void
  selectedRecipe: Recipe | null
  canManageSelectedRecipe: boolean
  onCloseModal: () => void
  onEditRecipe: (recipe: Recipe) => void
  onDeleteRecipe: (recipeId: number) => Promise<void>
  onTogglePublic: (recipe: Recipe) => Promise<void>
}

export default function RecipeDashboard({
  userRecipes,
  communityRecipes,
  sampleRecipes,
  favoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
  onStartCreateRecipe,
  selectedRecipe,
  canManageSelectedRecipe,
  onCloseModal,
  onEditRecipe,
  onDeleteRecipe,
  onTogglePublic,
}: RecipeDashboardProps) {
  return (
    <>
      {userRecipes.length > 0 ? (
        <RecipeSection
          eyebrow="Your kitchen"
          title="Your Recipes"
          countLabel="saved"
          recipes={userRecipes}
          favoriteRecipeIds={favoriteRecipeIds}
          onToggleFavorite={onToggleFavorite}
          onSelectRecipe={onSelectRecipe}
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
        favoriteRecipeIds={favoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
      />

      <RecipeSection
        eyebrow="Community inspiration"
        title="Explore Recipes"
        countLabel="ideas"
        recipes={sampleRecipes}
        favoriteRecipeIds={favoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
      />

      {selectedRecipe ? (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={onCloseModal}
          onEdit={onEditRecipe}
          onDelete={onDeleteRecipe}
          onTogglePublic={onTogglePublic}
          canManage={canManageSelectedRecipe}
        />
      ) : null}
    </>
  )
}
