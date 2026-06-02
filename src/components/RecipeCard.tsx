import type { MouseEvent, SyntheticEvent } from 'react'
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
import { getRecipeCategoryNames, toCategoryTag } from '../utils/categories'
import ShareRecipeButton from './ShareRecipeButton'

type RecipeCardProps = {
  recipe: Recipe
  isSaved: boolean
  onToggleSaved: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  liked?: boolean
  likeCount?: number
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
}

function RecipeCard({
  recipe,
  isSaved,
  onToggleSaved,
  onSelectRecipe,
  liked,
  likeCount = 0,
  onToggleLike,
  onViewAuthor,
}: RecipeCardProps) {
  const fallbackImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80&auto=format&fit=crop'

  function handleImageError(event: SyntheticEvent<HTMLImageElement, Event>) {
    event.currentTarget.src = fallbackImage
  }

  function handleCardClick() {
    onSelectRecipe(recipe)
  }

  function handleSaveClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    onToggleSaved(recipe)
  }

  function handleAuthorClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (recipe.authorUsername) {
      onViewAuthor?.(recipe.authorUsername)
    }
  }

  const showAuthor =
    recipe.source !== 'sample' &&
    Boolean(recipe.authorUsername || recipe.authorName)

  const authorLabel = recipe.authorUsername
    ? `@${recipe.authorUsername}`
    : recipe.authorName

  const isOwnRecipe = recipe.source === 'user'
  const recipeCategories = getRecipeCategoryNames(recipe).slice(0, 3)

  return (
    <article className="recipe-card">
      <button
        type="button"
        className="recipe-card__open-button"
        onClick={handleCardClick}
        aria-label={`Open ${recipe.title}`}
      >
        <img
          src={recipe.image || fallbackImage}
          alt={recipe.title}
          className="recipe-card__image"
          loading="lazy"
          onError={handleImageError}
        />

        <div className="recipe-card__content">
          <div className="recipe-card__meta">
            <div className="recipe-card__category-list">
              {recipeCategories.map((categoryName) => {
                const tag = toCategoryTag(categoryName)
                return (
                  <p key={categoryName} className="recipe-card__category">
                    {tag?.icon ? <span aria-hidden="true">{tag.icon}</span> : null}
                    <span>{categoryName}</span>
                  </p>
                )
              })}
            </div>

            <span className="recipe-card__badge recipe-card__badge--with-icon">
              {isOwnRecipe ? (
                <>
                  <User size={14} aria-hidden="true" />
                  <span>Yours</span>
                </>
              ) : (
                <>
                  <Globe size={14} aria-hidden="true" />
                  <span>Community</span>
                </>
              )}
            </span>
          </div>

          <h3 className="recipe-card__title">{recipe.title}</h3>

          <p className="recipe-card__description">{recipe.description}</p>

          <div className="recipe-card__nutrition">
            <span className="recipe-card__nutrition-item">
              <Flame size={14} aria-hidden="true" />
              {recipe.calories}
            </span>
            <span className="recipe-card__nutrition-item">
              <Drumstick size={14} aria-hidden="true" />
              {recipe.protein}g
            </span>
            <span className="recipe-card__nutrition-item">
              <Wheat size={14} aria-hidden="true" />
              {recipe.carbs}g
            </span>
            <span className="recipe-card__nutrition-item">
              <Heart size={14} aria-hidden="true" />
              {recipe.fat}g
            </span>
          </div>
        </div>
      </button>

      <div className="recipe-card__footer">
        {showAuthor ? (
          recipe.authorUsername ? (
            <button
              type="button"
              className="recipe-card__author-link"
              onClick={handleAuthorClick}
              aria-label={`View profile of ${recipe.authorUsername}`}
            >
              {authorLabel}
            </button>
          ) : (
            <span className="recipe-card__author-name">{authorLabel}</span>
          )
        ) : null}

        <ShareRecipeButton
          recipe={recipe}
          className="recipe-card__share-button"
        />

        <button
          type="button"
          className={
            isSaved ? 'save-button save-button--active' : 'save-button'
          }
          onClick={handleSaveClick}
          aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
        >
          <Heart
            size={16}
            aria-hidden="true"
            fill={isSaved ? 'currentColor' : 'none'}
          />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
        {recipe.source !== 'sample' && (
          <button
            type="button"
            className={liked ? 'like-button like-button--active' : 'like-button'}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleLike?.(recipe.id)
            }}
            aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
          >
            <ThumbsUp
              size={16}
              aria-hidden="true"
              fill={liked ? 'currentColor' : 'none'}
            />
            <span>{likeCount ?? 0}</span>
          </button>
        )}
      </div>
    </article>
  )
}

export default RecipeCard
