import type { Recipe } from '../types/Recipe'
import RecipeGrid from './RecipeGrid'

type RecipeSectionProps = {
  eyebrow: string
  title: string
  countLabel: string
  recipes: Recipe[]
  sampleFavoriteIds: number[]
  cloudFavoriteRecipeIds: number[]
  onToggleFavorite: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
}

export default function RecipeSection({
  eyebrow,
  title,
  countLabel,
  recipes,
  sampleFavoriteIds,
  cloudFavoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
  onToggleLike,
  onViewAuthor,
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
        sampleFavoriteIds={sampleFavoriteIds}
        cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
        onToggleFavorite={onToggleFavorite}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
      />
    </section>
  )
}
