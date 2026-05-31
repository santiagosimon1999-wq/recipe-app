import type { Recipe } from '../types/Recipe'
import { getRecipeListKey } from '../utils/favorites'

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70'

type ProfileRecipeGridProps = {
  recipes: Recipe[]
  onSelectRecipe: (recipe: Recipe) => void
  emptyHeading?: string
  emptyBody?: string
}

export default function ProfileRecipeGrid({
  recipes,
  onSelectRecipe,
  emptyHeading = 'No public recipes yet.',
  emptyBody = 'Check back soon for new shared recipes.',
}: ProfileRecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="profile-page__empty">
        <p className="profile-page__empty-heading">{emptyHeading}</p>
        <p>{emptyBody}</p>
      </div>
    )
  }

  return (
    <div className="profile-page__recipe-grid">
      {recipes.map((recipe) => (
        <article
          key={getRecipeListKey(recipe)}
          className="profile-page__recipe-card"
        >
          <button
            type="button"
            className="profile-page__recipe-card-button"
            onClick={() => onSelectRecipe(recipe)}
            aria-label={`Open ${recipe.title}`}
          >
            <div className="profile-page__recipe-thumb">
              <img
                src={recipe.image || FALLBACK_THUMB}
                alt={recipe.title}
                className="profile-page__recipe-thumb-img"
              />
            </div>
            <div className="profile-page__recipe-body">
              <div className="profile-page__recipe-meta">
                <span className="profile-page__recipe-category">
                  {recipe.category}
                </span>
                <span className="profile-page__recipe-badge">Shared</span>
              </div>
              <h3 className="profile-page__recipe-title">{recipe.title}</h3>
              <p className="profile-page__recipe-description">
                {recipe.description}
              </p>
            </div>
          </button>
        </article>
      ))}
    </div>
  )
}
