import { Link } from 'react-router'
import RecipeGrid from '../components/RecipeGrid'
import { useSavedRecipes } from '../hooks/useSavedRecipes'
import type { Recipe } from '../types/Recipe'

type SavedRecipesPageProps = {
  userId?: string
  sampleSavedRecipeIds: number[]
  cloudSavedRecipeIds: number[]
  likedRecipeIds?: number[]
  likeCountsByRecipeId?: Record<number, number>
  onToggleSaved: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
  onMergeLikeCounts?: (likeCounts: Record<number, number>) => void
  onMergeLikedRecipeIds?: (recipeIds: number[]) => void
}

export default function SavedRecipesPage({
  userId,
  sampleSavedRecipeIds,
  cloudSavedRecipeIds,
  likedRecipeIds,
  likeCountsByRecipeId,
  onToggleSaved,
  onSelectRecipe,
  onToggleLike,
  onViewAuthor,
  onMergeLikeCounts,
  onMergeLikedRecipeIds,
}: SavedRecipesPageProps) {
  const { recipes, loading, error, retry } = useSavedRecipes({
    userId,
    cloudSavedRecipeIds,
    onMergeLikeCounts,
    onMergeLikedRecipeIds,
  })

  if (!userId) {
    return (
      <section className="profile-page__state-screen">
        <p>Sign in to view and organize your saved recipes.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="profile-page__state-screen" aria-busy="true">
        <p>Loading your saved recipes…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="profile-page__state-screen">
        <p>{error}</p>
        <button
          type="button"
          className="profile-page__edit-profile-button"
          onClick={retry}
        >
          Retry
        </button>
      </section>
    )
  }

  return (
    <section className="recipe-section">
      <div className="recipe-section__header">
        <div>
          <p className="app-eyebrow">Saved</p>
          <h2>Saved recipes</h2>
        </div>
        <span>{recipes.length} saved</span>
      </div>

      <p className="community-feed__intro">
        Every recipe you save appears here. Collections are optional folders for
        organizing your saved recipes.
      </p>

      <p className="profile-page__recipes-hint">
        <Link to="/collections">Open collections</Link> to organize saved recipes.
      </p>

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
        emptyTitle="You haven’t saved any recipes yet."
        emptyBody="Save recipes from cards, then use collections to organize them."
      />
    </section>
  )
}
