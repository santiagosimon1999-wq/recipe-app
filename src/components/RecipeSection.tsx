import type { Recipe } from '../types/Recipe'
import RecipeGrid from './RecipeGrid'

type RecipeSectionProps = {
  eyebrow: string
  title: string
  countLabel: string
  recipes: Recipe[]
  favoriteRecipeIds: number[]
  onToggleFavorite: (recipeId: number) => void
  onSelectRecipe: (recipe: Recipe) => void
  onToggleLike?: (recipeId: number) => void
}

export default function RecipeSection({
  eyebrow,
  title,
  countLabel,
  recipes,
  favoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
  onToggleLike,
}: RecipeSectionProps) {
  if (recipes.length === 0) {
    return null
  }

  return (
    <section className="recipe-section">
      <div className="recipe-section__header">
        <div>
          <p className="app-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span>{recipes.length} {countLabel}</span>
      </div>

      <RecipeGrid
        recipes={recipes}
        favoriteRecipeIds={favoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
      />
    </section>
  )
}
