import type { Recipe } from '../types/Recipe'

type RecipeModalProps = {
  recipe: Recipe
  onClose: () => void
  onEdit: (recipe: Recipe) => void
  onDelete: (recipeId: number) => void
  canManage?: boolean
}

function RecipeModal({
  recipe,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
}: RecipeModalProps) {
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : recipe.instructions
        .split('\n')
        .map((step) => step.trim())
        .filter((step) => step !== '')

  return (
    <div className="recipe-modal__overlay" onClick={onClose}>
      <div
        className="recipe-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="recipe-modal__close-button"
          onClick={onClose}
        >
          ×
        </button>

        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="recipe-modal__image"
          />
        ) : null}

        <div className="recipe-modal__content">
          <div className="recipe-modal__header">
            <div>
              <p className="recipe-modal__category">{recipe.category}</p>
              <h2 className="recipe-modal__title">{recipe.title}</h2>
            </div>

            {recipe.source === 'sample' ? (
              <span className="recipe-card__badge">Sample</span>
            ) : null}
          </div>

          <p className="recipe-modal__description">{recipe.description}</p>

          <div className="recipe-modal__nutrition">
            <p><strong>Calories:</strong> {recipe.calories}</p>
            <p><strong>Protein:</strong> {recipe.protein}g</p>
            <p><strong>Carbs:</strong> {recipe.carbs}g</p>
            <p><strong>Fat:</strong> {recipe.fat}g</p>
          </div>

          <div className="recipe-modal__section">
            <h3>Ingredients</h3>
            <ul className="recipe-modal__list">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </div>

          <div className="recipe-modal__section">
            <h3>Instructions</h3>
            <ol className="recipe-modal__list">
              {instructions.map((step, index) => (
                <li key={`${index}-${step}`}>{step}</li>
              ))}
            </ol>
          </div>

          {canManage ? (
            <div className="recipe-modal__actions">
              <button type="button" onClick={() => onEdit(recipe)}>
                Edit
              </button>

              <button type="button" onClick={() => onDelete(recipe.id)}>
                Delete
              </button>
            </div>
          ) : recipe.source === 'sample' ? (
            <p className="recipe-modal__note">
              Sample recipes are view-only.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default RecipeModal