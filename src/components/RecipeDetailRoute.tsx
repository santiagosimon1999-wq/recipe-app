import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
import {
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
  getRecipeById,
} from '../lib/recipeService'
import type { Recipe } from '../types/Recipe'
import { parseDbRecipeId } from '../utils/favorites'

type RecipeDetailRouteProps = {
  userId?: string
  onRecipeReady: (recipe: Recipe) => void
}

export default function RecipeDetailRoute({
  userId,
  onRecipeReady,
}: RecipeDetailRouteProps) {
  const params = useParams<{ recipeId: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const parsedRecipeId = parseDbRecipeId(params.recipeId)

    if (parsedRecipeId === null) {
      setError('This recipe link is invalid.')
      return
    }

    const recipeId = parsedRecipeId

    async function load() {
      setError(null)

      try {
        const row = await getRecipeById(recipeId, userId)
        if (cancelled) return

        if (!row) {
          setError('This recipe is not available or is private.')
          return
        }

        let recipe = mapDbRowToRecipe(row, userId)

        if (recipe.source !== 'sample') {
          const [likeCounts, likedIds] = await Promise.all([
            getLikesCountsForRecipeIds([recipe.id]),
            userId
              ? getLikedRecipeIdsByUser(userId)
              : Promise.resolve([] as number[]),
          ])

          recipe = {
            ...recipe,
            likeCount: likeCounts[recipe.id] ?? 0,
            liked: likedIds.includes(recipe.id),
          }
        }

        onRecipeReady(recipe)
      } catch (err) {
        console.error('Failed to open recipe link:', err)
        if (!cancelled) {
          setError('Unable to open this recipe. Please try again.')
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [params.recipeId, userId, onRecipeReady])

  if (!error) {
    return (
      <section className="profile-page__state-screen" aria-busy="true">
        <p>Opening recipe…</p>
      </section>
    )
  }

  return (
    <section className="profile-page__state-screen">
      <p>{error}</p>
      <button
        type="button"
        className="profile-page__edit-profile-button"
        onClick={() => navigate('/community')}
      >
        Back to community
      </button>
    </section>
  )
}
