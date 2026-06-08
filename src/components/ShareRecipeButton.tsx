import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { notify } from '../lib/toast'
import {
  getRecipeShareUrl,
  recipeSupportsSharing,
} from '../utils/recipeShare'
import { getSupabaseRecipeId } from '../utils/favorites'
import type { Recipe } from '../types/Recipe'

type ShareRecipeButtonProps = {
  recipe: Recipe
  className?: string
}

export default function ShareRecipeButton({
  recipe,
  className = '',
}: ShareRecipeButtonProps) {
  const [copied, setCopied] = useState(false)

  if (!recipeSupportsSharing(recipe)) {
    return null
  }

  const recipeId = getSupabaseRecipeId(recipe)
  if (recipeId === null) return null

  async function handleShare() {
    const url = getRecipeShareUrl(recipeId!)

    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      setCopied(true)
      notify.success('Recipe link copied to clipboard.')
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      console.error('Share failed:', error)
      notify.error('Could not copy the recipe link.')
    }
  }

  return (
    <button
      type="button"
      className={`recipe-modal__edit-button share-recipe-button ${className}`.trim()}
      onClick={() => void handleShare()}
      aria-label="Share recipe"
    >
      <Link2 size={16} aria-hidden="true" />
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}
