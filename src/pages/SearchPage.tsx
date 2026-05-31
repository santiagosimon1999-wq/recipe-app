import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Recipe } from '../types/Recipe'
import { mapDbRowToRecipe } from '../lib/recipeMappers'
import './SearchPage.css'
import {
  type PublicRecipeSearchSort,
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

type SearchSort = PublicRecipeSearchSort | 'most-liked'

function parseNonNegativeNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined

  return parsed
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
  const [maxCaloriesInput, setMaxCaloriesInput] = useState('')
  const [minProteinInput, setMinProteinInput] = useState('')
  const [sortBy, setSortBy] = useState<SearchSort>('newest')
  const [results, setResults] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => {
      setSearchTerm(queryFromUrl)
    })
  }, [queryFromUrl])

  useEffect(() => {
    let cancelled = false
    const trimmed = searchTerm.trim()
    const maxCalories = parseNonNegativeNumber(maxCaloriesInput)
    const minProtein = parseNonNegativeNumber(minProteinInput)

    const timeout = window.setTimeout(() => {
      void (async () => {
        if (!trimmed) {
          if (!cancelled) {
            setResults([])
            setLoading(false)
          }
          return
        }

        setLoading(true)

        try {
          const rows = await searchPublicRecipes(trimmed, {
            excludeUserId: userId,
            category: selectedCategory === 'All' ? undefined : selectedCategory,
            maxCalories,
            minProtein,
            sortBy: sortBy === 'most-liked' ? 'newest' : sortBy,
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

          if (sortBy === 'most-liked') {
            mapped = [...mapped].sort((a, b) => {
              if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount
              return b.id - a.id
            })
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
  }, [
    searchTerm,
    userId,
    selectedCategory,
    maxCaloriesInput,
    minProteinInput,
    sortBy,
  ])

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
    const maxCalories = parseNonNegativeNumber(maxCaloriesInput)
    const minProtein = parseNonNegativeNumber(minProteinInput)

    const matchesCategory =
      selectedCategory === 'All' || recipe.category === selectedCategory
    const matchesCalories =
      maxCalories === undefined || recipe.calories <= maxCalories
    const matchesProtein =
      minProtein === undefined || recipe.protein >= minProtein

    const matchesFavorites =
      !showFavoritesOnly ||
      (recipe.source === 'sample'
        ? sampleFavoriteIds.includes(recipe.id)
        : cloudFavoriteRecipeIds.includes(recipe.id))

    return matchesCategory && matchesCalories && matchesProtein && matchesFavorites
  })

  const showClearFiltersButton =
    selectedCategory !== 'All' ||
    showFavoritesOnly ||
    maxCaloriesInput.trim() !== '' ||
    minProteinInput.trim() !== '' ||
    sortBy !== 'newest'

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
          setMaxCaloriesInput('')
          setMinProteinInput('')
          setSortBy('newest')
        }}
      />

      <section className="search-page__advanced-filters">
        <div className="search-page__filter-group">
          <label className="search-page__filter-label" htmlFor="search-sort">
            Sort results
          </label>
          <select
            id="search-sort"
            className="search-page__filter-input"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SearchSort)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most-liked">Most liked</option>
          </select>
        </div>

        <div className="search-page__nutrition-filters">
          <div className="search-page__filter-group">
            <label className="search-page__filter-label" htmlFor="max-calories">
              Max calories
            </label>
            <input
              id="max-calories"
              className="search-page__filter-input"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="e.g. 500"
              value={maxCaloriesInput}
              onChange={(event) => setMaxCaloriesInput(event.target.value)}
            />
          </div>

          <div className="search-page__filter-group">
            <label className="search-page__filter-label" htmlFor="min-protein">
              Min protein (g)
            </label>
            <input
              id="min-protein"
              className="search-page__filter-input"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="e.g. 20"
              value={minProteinInput}
              onChange={(event) => setMinProteinInput(event.target.value)}
            />
          </div>
        </div>
      </section>

      {loading ? (
        <RecipeGridSkeleton count={6} />
      ) : searchTerm.trim() === '' ? (
        <section className="search-page__empty-state">
          <h3>Start your search</h3>
          <p>
            Search by title, ingredient, or category to find public recipes from
            the community.
          </p>
        </section>
      ) : filteredResults.length === 0 ? (
        <section className="search-page__empty-state">
          <h3>No recipes matched</h3>
          <p>
            No public recipes matched your query and filters. Try a broader term
            or clear one of the filters.
          </p>
          {showClearFiltersButton ? (
            <button
              type="button"
              className="clear-filters-button"
              onClick={() => {
                setSelectedCategory('All')
                setShowFavoritesOnly(false)
                setMaxCaloriesInput('')
                setMinProteinInput('')
                setSortBy('newest')
              }}
            >
              Clear filters
            </button>
          ) : null}
        </section>
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
