import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Recipe } from '../types/Recipe'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
import {
  getLikedRecipeIdsByUser,
  getLikesCountsForRecipeIds,
  searchPublicRecipes,
} from '../lib/recipeService'
import DiscoverPanel from '../components/DiscoverPanel'
import RecipeGrid from '../components/RecipeGrid'
import { RecipeGridSkeleton } from '../components/ui/RecipeCardSkeleton'

type SearchPageProps = {
  userId?: string
  sampleFavoriteIds: number[]
  cloudFavoriteRecipeIds: number[]
  onToggleFavorite: (recipe: Recipe) => void
  onSelectRecipe: (recipe: Recipe) => void
  onToggleLike?: (recipeId: number) => void
  onViewAuthor?: (username: string) => void
}

export default function SearchPage({
  userId,
  sampleFavoriteIds,
  cloudFavoriteRecipeIds,
  onToggleFavorite,
  onSelectRecipe,
  onToggleLike,
  onViewAuthor,
}: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') ?? ''

  const [searchTerm, setSearchTerm] = useState(queryFromUrl)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [results, setResults] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSearchTerm(queryFromUrl)
  }, [queryFromUrl])

  useEffect(() => {
    let cancelled = false
    const trimmed = searchTerm.trim()

    if (!trimmed) {
      setResults([])
      setLoading(false)
      return
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        setLoading(true)

        try {
          const rows = await searchPublicRecipes(trimmed, {
            excludeUserId: userId,
          })

          if (cancelled) return

          let mapped = rows.map((row) => mapDbRowToRecipe(row, userId))
          const ids = mapped.map((recipe) => recipe.id)

          if (ids.length > 0) {
            const [likeCounts, likedIds] = await Promise.all([
              getLikesCountsForRecipeIds(ids),
              userId
                ? getLikedRecipeIdsByUser(userId)
                : Promise.resolve([] as number[]),
            ])

            mapped = mapped.map((recipe) => ({
              ...recipe,
              likeCount: likeCounts[recipe.id] ?? 0,
              liked: likedIds.includes(recipe.id),
            }))
          }

          if (!cancelled) setResults(mapped)
        } catch (error) {
          console.error('Search failed:', error)
          if (!cancelled) setResults([])
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [searchTerm, userId])

  useEffect(() => {
    const trimmed = searchTerm.trim()
    const current = searchParams.get('q') ?? ''
    if (trimmed === current) return

    if (trimmed) {
      setSearchParams({ q: trimmed }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [searchTerm, searchParams, setSearchParams])

  const filteredResults = results.filter((recipe) => {
    const matchesCategory =
      selectedCategory === 'All' || recipe.category === selectedCategory

    const matchesFavorites =
      !showFavoritesOnly ||
      (recipe.source === 'sample'
        ? sampleFavoriteIds.includes(recipe.id)
        : cloudFavoriteRecipeIds.includes(recipe.id))

    return matchesCategory && matchesFavorites
  })

  const showClearFiltersButton =
    selectedCategory !== 'All' || showFavoritesOnly

  return (
    <section className="recipe-section search-page">
      <div className="recipe-section__header">
        <div>
          <p className="app-eyebrow">Search</p>
          <h2>Find recipes across the community</h2>
        </div>
      </div>

      <DiscoverPanel
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        showFavoritesOnly={showFavoritesOnly}
        showClearFiltersButton={showClearFiltersButton}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onToggleShowFavoritesOnly={() =>
          setShowFavoritesOnly((value) => !value)
        }
        onClearFilters={() => {
          setSelectedCategory('All')
          setShowFavoritesOnly(false)
        }}
      />

      {loading ? (
        <RecipeGridSkeleton count={6} />
      ) : searchTerm.trim() === '' ? (
        <p className="community-feed__intro">
          Type a recipe name, ingredient, or category to search public recipes.
        </p>
      ) : (
        <>
          <p className="community-feed__intro">
            {filteredResults.length} result
            {filteredResults.length === 1 ? '' : 's'} for &ldquo;{searchTerm.trim()}
            &rdquo;
          </p>
          <RecipeGrid
            recipes={filteredResults}
            sampleFavoriteIds={sampleFavoriteIds}
            cloudFavoriteRecipeIds={cloudFavoriteRecipeIds}
            onToggleFavorite={onToggleFavorite}
            onSelectRecipe={onSelectRecipe}
            onToggleLike={onToggleLike}
            onViewAuthor={onViewAuthor}
          />
        </>
      )}
    </section>
  )
}
