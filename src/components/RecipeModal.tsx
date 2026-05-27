import type { Recipe } from '../types/Recipe'

type RecipeModalProps = {
  recipe: Recipe
  onClose: () => void
  onEdit: (recipe: Recipe) => void
  onDelete: (recipeId: number) => void
  onTogglePublic?: (recipe: Recipe) => void
  canManage?: boolean
  liked: boolean
  likeCount: number
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
}

function RecipeModal({
  recipe,
  onClose,
  onEdit,
  onDelete,
  onTogglePublic,
  canManage = false,
  liked,
  likeCount,
  onToggleLike,
  onViewAuthor,
}: RecipeModalProps) {
  const instructions = recipe.instructions
    .split('\n')
    .map((step) => step.trim())
    .filter((step) => step !== '')

  const recipeStatusLabel =
    recipe.source === 'community'
      ? `Shared by ${recipe.authorName ?? 'Community Chef'}`
      : recipe.source === 'user'
        ? recipe.isPublic
          ? 'Your shared recipe'
          : 'Your private recipe'
        : 'Sample recipe'

  const showAuthorLink =
    Boolean(recipe.authorUsername) && recipe.source === 'community'

  function handleAuthorClick() {
    if (recipe.authorUsername) {
      onClose()
      onViewAuthor?.(recipe.authorUsername)
    }
  }

  return (
    <div className="recipe-modal-overlay" onClick={onClose}>
      <div
        className="recipe-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="recipe-modal__top-bar">
          <div className="recipe-modal__actions">
            {recipe.source !== 'sample' && (
              <button
                type="button"
                className={
                  liked ? 'like-button like-button--active' : 'like-button'
                }
                onClick={() => onToggleLike?.(recipe.id)}
              >
                {liked ? `💚 ${likeCount}` : `🤍 ${likeCount}`}
              </button>
            )}
            {canManage ? (
              <>
                <button
                  type="button"
                  className="recipe-modal__edit-button"
                  onClick={() => onEdit(recipe)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="recipe-modal__edit-button"
                  onClick={() => onTogglePublic?.(recipe)}
                >
                  {recipe.isPublic ? 'Make Private' : 'Share Recipe'}
                </button>

                <button
                  type="button"
                  className="recipe-modal__delete-button"
                  onClick={() => onDelete(recipe.id)}
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>

          <button
            type="button"
            className="recipe-modal__close-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="recipe-modal__image"
          />
        ) : null}

        <div className="recipe-modal__badges">
          <p className="recipe-card__category">{recipe.category}</p>
          <p className="recipe-card__badge">{recipeStatusLabel}</p>
          {showAuthorLink ? (
            <button
              type="button"
              className="recipe-modal__author-link"
              onClick={handleAuthorClick}
              aria-label={`View profile of ${recipe.authorUsername}`}
            >
              @{recipe.authorUsername}
            </button>
          ) : null}
        </div>

        <h2 className="recipe-modal__title">{recipe.title}</h2>

        <p className="recipe-modal__description">{recipe.description}</p>

        <div className="recipe-modal__nutrition-grid">
          <div className="recipe-modal__nutrition-item">
            <span>Calories</span>
            <strong>{recipe.calories}</strong>
          </div>

          <div className="recipe-modal__nutrition-item">
            <span>Protein</span>
            <strong>{recipe.protein}g</strong>
          </div>

          <div className="recipe-modal__nutrition-item">
            <span>Carbs</span>
            <strong>{recipe.carbs}g</strong>
          </div>

          <div className="recipe-modal__nutrition-item">
            <span>Fat</span>
            <strong>{recipe.fat}g</strong>
          </div>
        </div>

        <div className="recipe-modal__section">
          <h3>Ingredients</h3>
          <ul className="recipe-modal__ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${index}-${ingredient}`}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="recipe-modal__section">
          <h3>Instructions</h3>
          <ol className="recipe-modal__instructions-list">
            {instructions.map((step, index) => (
              <li key={`${index}-${step}`}>{step}</li>
            ))}
          </ol>
        </div>

        {!canManage && recipe.source === 'sample' ? (
          <p className="recipe-modal__description">
            Sample recipes are view-only.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default RecipeModal
