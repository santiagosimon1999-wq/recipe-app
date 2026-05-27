import { useId } from 'react'
import {
  Drumstick,
  Flame,
  Heart,
  ThumbsUp,
  User,
  Wheat,
} from 'lucide-react'
import type { Recipe } from '../types/Recipe'
import { ErrorBoundary } from './ErrorBoundary'
import { Modal } from './ui/Modal'
import SaveToCollectionButton from './SaveToCollectionButton'
import ShareRecipeButton from './ShareRecipeButton'
import RecipeComments from './RecipeComments'

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
  const titleId = useId()

  const instructions = (recipe.instructions ?? '')
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

  const showAuthor =
    recipe.source !== 'sample' &&
    Boolean(recipe.authorUsername || recipe.authorName)

  const showAuthorLink = Boolean(recipe.authorUsername)

  const authorLabel = recipe.authorUsername
    ? `@${recipe.authorUsername}`
    : recipe.authorName

  function handleAuthorClick() {
    if (recipe.authorUsername) {
      onClose()
      onViewAuthor?.(recipe.authorUsername)
    }
  }

  return (
    <Modal isOpen onClose={onClose} labelledBy={titleId}>
      <div className="recipe-modal__layout">
        <div className="recipe-modal__scroll-body">
          <div className="recipe-modal__top-bar">
            <div className="recipe-modal__actions">
              {recipe.source !== 'sample' && (
                <button
                  type="button"
                  className={
                    liked ? 'like-button like-button--active' : 'like-button'
                  }
                  onClick={() => onToggleLike?.(recipe.id)}
                  aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
                >
                  <ThumbsUp
                    size={16}
                    aria-hidden="true"
                    fill={liked ? 'currentColor' : 'none'}
                  />
                  <span>{likeCount}</span>
                </button>
              )}
              <ShareRecipeButton recipe={recipe} />
              <SaveToCollectionButton recipe={recipe} />
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
            <p className="recipe-card__badge recipe-card__badge--with-icon">
              {recipe.source === 'user' ? (
                <>
                  <User size={14} aria-hidden="true" />
                  <span>{recipeStatusLabel}</span>
                </>
              ) : (
                <span>{recipeStatusLabel}</span>
              )}
            </p>
            {showAuthor ? (
              showAuthorLink ? (
                <button
                  type="button"
                  className="recipe-modal__author-link"
                  onClick={handleAuthorClick}
                  aria-label={`View profile of ${recipe.authorUsername}`}
                >
                  {authorLabel}
                </button>
              ) : (
                <span className="recipe-modal__author-name">{authorLabel}</span>
              )
            ) : null}
          </div>

          <h2 id={titleId} className="recipe-modal__title">
            {recipe.title}
          </h2>

          <p className="recipe-modal__description">{recipe.description}</p>

          <div className="recipe-modal__nutrition-grid">
            <div className="recipe-modal__nutrition-item">
              <div className="recipe-modal__nutrition-label">
                <Flame size={14} aria-hidden="true" /> Calories
              </div>
              <div className="recipe-modal__nutrition-value">
                {recipe.calories}
              </div>
            </div>

            <div className="recipe-modal__nutrition-item">
              <div className="recipe-modal__nutrition-label">
                <Drumstick size={14} aria-hidden="true" /> Protein
              </div>
              <div className="recipe-modal__nutrition-value">
                {recipe.protein}g
              </div>
            </div>

            <div className="recipe-modal__nutrition-item">
              <div className="recipe-modal__nutrition-label">
                <Wheat size={14} aria-hidden="true" /> Carbs
              </div>
              <div className="recipe-modal__nutrition-value">
                {recipe.carbs}g
              </div>
            </div>

            <div className="recipe-modal__nutrition-item">
              <div className="recipe-modal__nutrition-label">
                <Heart size={14} aria-hidden="true" /> Fat
              </div>
              <div className="recipe-modal__nutrition-value">
                {recipe.fat}g
              </div>
            </div>
          </div>

          <div className="recipe-modal__section">
            <h3>Ingredients</h3>
            <ul className="recipe-modal__ingredients-list">
              {(recipe.ingredients ?? []).map((ingredient, index) => (
                <li key={`${index}-${ingredient}`}>{ingredient}</li>
              ))}
            </ul>
          </div>

          <div className="recipe-modal__section recipe-modal__section--last">
            <h3>Instructions</h3>
            <ol className="recipe-modal__instructions-list">
              {instructions.map((step, index) => (
                <li key={`${index}-${step}`}>{step}</li>
              ))}
            </ol>
          </div>

        </div>

        <div className="recipe-modal__comments-panel">
          <ErrorBoundary
            fallback={(error) => (
              <section className="recipe-comments recipe-comments--error">
                <h3 className="recipe-comments__title">Comments</h3>
                <p className="recipe-comments__error" role="alert">
                  Could not load comments: {error.message}
                </p>
              </section>
            )}
          >
            <RecipeComments recipe={recipe} onViewAuthor={onViewAuthor} />
          </ErrorBoundary>
        </div>
      </div>
    </Modal>
  )
}

export default RecipeModal
