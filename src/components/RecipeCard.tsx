import type { SyntheticEvent } from 'react'
import type { Recipe } from '../types/Recipe'

type RecipeCardProps = {
  recipe: Recipe
  isFavorite: boolean
  onToggleFavorite: (recipeId: number) => void
  onSelectRecipe: (recipe: Recipe) => void
}

function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
  onSelectRecipe,
}: RecipeCardProps) {
  const fallbackImage =
    'https://via.placeholder.com/1200x800?text=Recipe+Image'

  function handleImageError(event: SyntheticEvent<HTMLImageElement, Event>) {
    event.currentTarget.src = fallbackImage
  }

  return (
    <article className="recipe-card">
      <img
        src={recipe.image || fallbackImage}
        alt={recipe.title}
        className="recipe-card__image"
        onClick={() => onSelectRecipe(recipe)}
        onError={handleImageError}
      />

      <div className="recipe-card__content">
        <div className="recipe-card__meta">
          <p className="recipe-card__category">{recipe.category}</p>
          {recipe.source === 'sample' ? (
            <span className="recipe-card__badge">Sample</span>
          ) : null}
        </div>

        <h3 className="recipe-card__title">{recipe.title}</h3>

        <p className="recipe-card__description">{recipe.description}</p>

        <p className="recipe-card__calories">{recipe.calories} calories</p>

        <button
          type="button"
          className="recipe-card__favorite-button"
          onClick={() => onToggleFavorite(recipe.id)}
        >
          {isFavorite ? 'Remove favorite' : 'Add to favorites'}
        </button>
      </div>
    </article>
  )
}

export default RecipeCard