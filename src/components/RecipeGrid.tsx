import type { Recipe } from "../types/Recipe";
import { getRecipeListKey, isRecipeFavorited } from "../utils/favorites";
import RecipeCard from "./RecipeCard";

type RecipeGridProps = {
  recipes: Recipe[];
  sampleFavoriteIds: number[];
  cloudFavoriteRecipeIds: number[];
  onToggleFavorite: (recipe: Recipe) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleLike?: (recipeId: number) => void;
  onViewAuthor?: (username: string) => void;
};

function RecipeGrid({
  recipes,
  sampleFavoriteIds,
  cloudFavoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
  onToggleLike,
  onViewAuthor,
}: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <section className="recipe-grid-empty">
        <h2>No recipes found</h2>
        <p>Try a different search or choose another category.</p>
      </section>
    );
  }

  return (
    <section className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard
          key={getRecipeListKey(recipe)}
          recipe={recipe}
          isFavorite={isRecipeFavorited(
            recipe,
            sampleFavoriteIds,
            cloudFavoriteRecipeIds
          )}
          onToggleFavorite={onToggleFavorite}
          onSelectRecipe={onSelectRecipe}
          liked={Boolean(recipe.liked)}
          likeCount={recipe.likeCount ?? 0}
          onToggleLike={onToggleLike}
          onViewAuthor={onViewAuthor}
        />
      ))}
    </section>
  );
}

export default RecipeGrid;
