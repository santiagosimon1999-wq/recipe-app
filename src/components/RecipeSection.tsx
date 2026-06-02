import type { Recipe } from '../types/Recipe'
import RecipeGrid from './RecipeGrid'

type RecipeSectionProps = {
  eyebrow: string
  title: string
  countLabel: string
  recipes: Recipe[]
  sampleSavedRecipeIds: number[]
  cloudSavedRecipeIds: number[]
  likedRecipeIds?: number[]
  likeCountsByRecipeId?: Record<number, number>
  onToggleSaved: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
  onEdit?: (recipe: Recipe) => void
}

export default function RecipeSection({
  eyebrow,
  title,
  countLabel,
  recipes,
  sampleSavedRecipeIds,
  cloudSavedRecipeIds,
  likedRecipeIds,
  likeCountsByRecipeId,
  onToggleSaved,
  onSelectRecipe,
  onToggleLike,
  onViewAuthor,
  onEdit,
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
        sampleSavedRecipeIds={sampleSavedRecipeIds}
        cloudSavedRecipeIds={cloudSavedRecipeIds}
        likedRecipeIds={likedRecipeIds}
        likeCountsByRecipeId={likeCountsByRecipeId}
        onToggleSaved={onToggleSaved}
        onSelectRecipe={onSelectRecipe}
        onToggleLike={onToggleLike}
        onViewAuthor={onViewAuthor}
        onEdit={onEdit}
      />
    </section>
  )
}
