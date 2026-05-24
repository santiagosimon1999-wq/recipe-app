import { useEffect } from "react";
import type { Recipe } from "../types/Recipe";

type RecipeModalProps = {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: number) => void;
};

function RecipeModal({
  recipe,
  onClose,
  onEdit,
  onDelete,
}: RecipeModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const ingredientList = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  const instructionSteps = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : typeof recipe.instructions === "string"
      ? recipe.instructions
          .split("\n")
          .map((step) => step.trim())
          .filter((step) => step !== "")
      : [];

  return (
    <div className="recipe-modal-overlay" onClick={onClose}>
      <div
        className="recipe-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="recipe-modal__top-bar">
          <button
            type="button"
            className="recipe-modal__close-button"
            onClick={onClose}
          >
            Close
          </button>

          <div className="recipe-modal__actions">
            <button
              type="button"
              className="recipe-modal__edit-button"
              onClick={() => onEdit(recipe)}
            >
              Edit
            </button>

            <button
              type="button"
              className="recipe-modal__delete-button"
              onClick={() => onDelete(recipe.id)}
            >
              Delete
            </button>
          </div>
        </div>

        <img
          className="recipe-modal__image"
          src={recipe.image}
          alt={recipe.title}
        />

        <h2 className="recipe-modal__title">{recipe.title}</h2>
        <p className="recipe-modal__description">{recipe.description}</p>

        <div className="recipe-modal__nutrition-grid">
          <div className="recipe-modal__nutrition-item">
            <span>Calories</span>
            <strong>{recipe.calories ?? 0}</strong>
          </div>
          <div className="recipe-modal__nutrition-item">
            <span>Protein</span>
            <strong>{recipe.protein ?? 0}g</strong>
          </div>
          <div className="recipe-modal__nutrition-item">
            <span>Carbs</span>
            <strong>{recipe.carbs ?? 0}g</strong>
          </div>
          <div className="recipe-modal__nutrition-item">
            <span>Fat</span>
            <strong>{recipe.fat ?? 0}g</strong>
          </div>
        </div>

        <div className="recipe-modal__section">
          <h3>Ingredients</h3>
          {ingredientList.length > 0 ? (
            <ul className="recipe-modal__ingredients-list">
              {ingredientList.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          ) : (
            <p>No ingredients available.</p>
          )}
        </div>

        <div className="recipe-modal__section">
          <h3>Instructions</h3>
          {instructionSteps.length > 0 ? (
            <ol className="recipe-modal__instructions-list">
              {instructionSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          ) : (
            <p>No instructions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeModal;