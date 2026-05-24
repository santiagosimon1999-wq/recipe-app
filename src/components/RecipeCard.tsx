import type { Recipe } from "../types/Recipe";

type RecipeCardProps = {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (recipeId: number) => void;
  onSelectRecipe: (recipe: Recipe) => void;
};

function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
  onSelectRecipe,
}: RecipeCardProps) {
  return (
    <article
      className="recipe-card"
      onClick={() => onSelectRecipe(recipe)}
    >
      <img
        className="recipe-card__image"
        src={recipe.image}
        alt={recipe.title}
      />

      <div className="recipe-card__content">
        <span className="recipe-card__category">{recipe.category}</span>

        <h2 className="recipe-card__title">{recipe.title}</h2>

        <p className="recipe-card__description">{recipe.description}</p>

        <p className="recipe-card__calories">{recipe.calories} calories</p>

        <button
          type="button"
          className={
            isFavorite
              ? "favorite-button favorite-button--active"
              : "favorite-button"
          }
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(recipe.id);
          }}
        >
          {isFavorite ? "Remove from favorites" : "Add to favorites"}
        </button>
      </div>
    </article>
  );
}

export default RecipeCard;
