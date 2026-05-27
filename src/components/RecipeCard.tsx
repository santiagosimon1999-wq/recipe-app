import type { MouseEvent, SyntheticEvent } from 'react'
import type { Recipe } from '../types/Recipe'

type RecipeCardProps = {
  recipe: Recipe
  isFavorite: boolean
  onToggleFavorite: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  liked?: boolean
  likeCount?: number
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
}

function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
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

  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    onToggleFavorite(recipe)
  }

  function handleAuthorClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (recipe.authorUsername) {
      onViewAuthor?.(recipe.authorUsername)
    }
  }

  const showAuthor =
    Boolean(recipe.authorUsername) && recipe.source === 'community'

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
          onError={handleImageError}
        />

        <div className="recipe-card__content">
          <div className="recipe-card__meta">
            <p className="recipe-card__category">{recipe.category}</p>

            {recipe.source === 'sample' ? (
              <span className="recipe-card__badge">🌎 Community</span>
            ) : (
              <span className="recipe-card__badge">👤 Yours</span>
            )}
          </div>

          <h3 className="recipe-card__title">{recipe.title}</h3>

          <p className="recipe-card__description">{recipe.description}</p>

          <div className="recipe-card__nutrition">
            <span>🔥 {recipe.calories}</span>
            <span>🥩 {recipe.protein}g</span>
            <span>🍚 {recipe.carbs}g</span>
            <span>🥑 {recipe.fat}g</span>
          </div>
        </div>
      </button>

      <div className="recipe-card__footer">
        {showAuthor ? (
          <button
            type="button"
            className="recipe-card__author-link"
            onClick={handleAuthorClick}
            aria-label={`View profile of ${recipe.authorUsername}`}
          >
            @{recipe.authorUsername}
          </button>
        ) : null}

        <button
          type="button"
          className={
            isFavorite
              ? 'favorite-button favorite-button--active'
              : 'favorite-button'
          }
          onClick={handleFavoriteClick}
        >
          {isFavorite ? '❤️ Favorited' : '🤍 Favorite'}
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
          >
            {liked ? `💚 ${likeCount ?? 0}` : `🤍 ${likeCount ?? 0}`}
          </button>
        )}
      </div>
    </article>
  )
}

export default RecipeCard
