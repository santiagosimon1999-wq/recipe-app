import type { Recipe } from "../types/Recipe";
import RecipeCard from "./RecipeCard";

type RecipeGridProps = {
  recipes: Recipe[];
  favoriteRecipeIds: number[];
  onToggleFavorite: (recipeId: number) => void;
  onSelectRecipe: (recipe: Recipe) => void;
};

function RecipeGrid({
  recipes,
  favoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
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
          key={recipe.id}
          recipe={recipe}
          isFavorite={favoriteRecipeIds.includes(recipe.id)}
          onToggleFavorite={onToggleFavorite}
          onSelectRecipe={onSelectRecipe}
        />
      ))}
    </section>
  );
}

export default RecipeGrid;

