import type { Recipe } from "../types/Recipe";
import { getRecipeListKey, isRecipeSaved } from "../utils/favorites";
import RecipeCard from "./RecipeCard";

type RecipeGridProps = {
  recipes: Recipe[];
  sampleSavedRecipeIds: number[];
  cloudSavedRecipeIds: number[];
  likedRecipeIds?: number[];
  likeCountsByRecipeId?: Record<number, number>;
  emptyTitle?: string;
  emptyBody?: string;
  onToggleSaved: (recipe: Recipe) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleLike?: (recipeId: number) => void;
  onViewAuthor?: (username: string) => void;
  onEdit?: (recipe: Recipe) => void;
};

function RecipeGrid({
  recipes,
  sampleSavedRecipeIds,
  cloudSavedRecipeIds,
  likedRecipeIds,
  likeCountsByRecipeId,
  emptyTitle = "No recipes found",
  emptyBody = "Try a different search or choose another category.",
  onToggleSaved,
  onSelectRecipe,
  onToggleLike,
  onViewAuthor,
  onEdit,
}: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <section className="recipe-grid-empty">
        <h2>{emptyTitle}</h2>
        <p>{emptyBody}</p>
      </section>
    );
  }

  return (
    <section className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard
          key={getRecipeListKey(recipe)}
          recipe={recipe}
          isSaved={isRecipeSaved(
            recipe,
            sampleSavedRecipeIds,
            cloudSavedRecipeIds
          )}
          onToggleSaved={onToggleSaved}
          onSelectRecipe={onSelectRecipe}
          liked={likedRecipeIds?.includes(recipe.id) ?? Boolean(recipe.liked)}
          likeCount={likeCountsByRecipeId?.[recipe.id] ?? recipe.likeCount ?? 0}
          onToggleLike={onToggleLike}
          onViewAuthor={onViewAuthor}
          onEdit={onEdit}
        />
      ))}
    </section>
  );
}

export default RecipeGrid;
