import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import type { CategoryOption } from '../utils/categories'
import type { CategoryGroupKey } from '../types/Category'

type DiscoverPanelProps = {
  searchTerm: string
  selectedCategory: string
  categoryOptions?: Record<CategoryGroupKey, CategoryOption[]>
  showSavedOnly: boolean
  showClearFiltersButton: boolean
  onSearchChange: (searchTerm: string) => void
  onCategoryChange: (category: string) => void
  onToggleShowSavedOnly: () => void
  onClearFilters: () => void
}

export default function DiscoverPanel({
  searchTerm,
  selectedCategory,
  categoryOptions,
  showSavedOnly,
  showClearFiltersButton,
  onSearchChange,
  onCategoryChange,
  onToggleShowSavedOnly,
  onClearFilters,
}: DiscoverPanelProps) {
  return (
    <section className="discover-panel">
      <div className="discover-panel__header">
        <div>
          <p className="app-eyebrow">Discover</p>
          <h2>Find your next meal</h2>
        </div>
      </div>

      <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />

      <CategoryFilter
        selectedCategory={selectedCategory}
        categoryOptions={categoryOptions}
        onCategoryChange={onCategoryChange}
      />

      <div className="filter-actions">
        <button
          type="button"
          className={
            showSavedOnly
              ? 'saved-toggle-button saved-toggle-button--active'
              : 'saved-toggle-button'
          }
          onClick={onToggleShowSavedOnly}
        >
          {showSavedOnly ? '★ Saved only' : '☆ Show saved'}
        </button>

        {showClearFiltersButton ? (
          <button
            type="button"
            className="clear-filters-button"
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </section>
  )
}
