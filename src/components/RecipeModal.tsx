import { useId } from 'react'
import {
  Drumstick,
  Flame,
  Globe,
  Heart,
  ThumbsUp,
  User,
  Wheat,
} from 'lucide-react'
import type { Recipe } from '../types/Recipe'
import { Modal } from './ui/Modal'

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
    <Modal isOpen onClose={onClose} labelledBy={titleId}>
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
          {recipe.source === 'sample' ? (
            <>
              <Globe size={14} aria-hidden="true" />
              <span>Community</span>
            </>
          ) : recipe.source === 'user' ? (
            <>
              <User size={14} aria-hidden="true" />
              <span>{recipeStatusLabel}</span>
            </>
          ) : (
            <span>{recipeStatusLabel}</span>
          )}
        </p>
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

      <h2 id={titleId} className="recipe-modal__title">
        {recipe.title}
      </h2>

      <p className="recipe-modal__description">{recipe.description}</p>

      <div className="recipe-modal__nutrition-grid">
        <div className="recipe-modal__nutrition-item">
          <span>
            <Flame size={14} aria-hidden="true" /> Calories
          </span>
          <strong>{recipe.calories}</strong>
        </div>

        <div className="recipe-modal__nutrition-item">
          <span>
            <Drumstick size={14} aria-hidden="true" /> Protein
          </span>
          <strong>{recipe.protein}g</strong>
        </div>

        <div className="recipe-modal__nutrition-item">
          <span>
            <Wheat size={14} aria-hidden="true" /> Carbs
          </span>
          <strong>{recipe.carbs}g</strong>
        </div>

        <div className="recipe-modal__nutrition-item">
          <span>
            <Heart size={14} aria-hidden="true" /> Fat
          </span>
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
    </Modal>
  )
}

export default RecipeModal
