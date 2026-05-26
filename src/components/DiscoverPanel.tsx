import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'

type DiscoverPanelProps = {
  searchTerm: string
  selectedCategory: string
  showFavoritesOnly: boolean
  showClearFiltersButton: boolean
  onSearchChange: (searchTerm: string) => void
  onCategoryChange: (category: string) => void
  onToggleShowFavoritesOnly: () => void
  onClearFilters: () => void
}

export default function DiscoverPanel({
  searchTerm,
  selectedCategory,
  showFavoritesOnly,
  showClearFiltersButton,
  onSearchChange,
  onCategoryChange,
  onToggleShowFavoritesOnly,
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
        onCategoryChange={onCategoryChange}
      />

      <div className="filter-actions">
        <button
          type="button"
          className={
            showFavoritesOnly
              ? 'favorites-toggle-button favorites-toggle-button--active'
              : 'favorites-toggle-button'
          }
          onClick={onToggleShowFavoritesOnly}
        >
          {showFavoritesOnly ? '★ Favorites only' : '☆ Show favorites'}
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
