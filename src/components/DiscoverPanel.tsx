import { SlidersHorizontal, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import {
  getActiveFilterCountLabel,
  getFiltersToggleAriaLabel,
  readDiscoverFiltersOpenState,
  writeDiscoverFiltersOpenState,
} from '../lib/discoverFilters'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { CategoryGroupKey } from '../types/Category'
import type { CategoryOption } from '../utils/categories'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'
import { Modal } from './ui/Modal'

export type DiscoverFilterChip = {
  id: string
  label: string
  onRemove: () => void
}

type DiscoverPanelProps = {
  searchTerm: string
  selectedCategories: string[]
  categoryOptions?: Record<CategoryGroupKey, CategoryOption[]>
  showSavedOnly: boolean
  showClearFiltersButton: boolean
  onSearchChange: (searchTerm: string) => void
  onCategoryToggle: (category: string) => void
  onToggleShowSavedOnly: () => void
  onClearFilters: () => void
  resultCount?: number
  extraFilterChips?: DiscoverFilterChip[]
  children?: ReactNode
  /** Adjusts heading/copy for home dashboard vs search vs default discover */
  variant?: 'discover' | 'search' | 'home'
}

function getInitialDesktopFiltersOpen(hasActiveFilters: boolean): boolean {
  const persisted = readDiscoverFiltersOpenState()
  if (persisted !== null) return persisted
  return hasActiveFilters
}

function DiscoverFilterContent({
  selectedCategories,
  categoryOptions,
  showSavedOnly,
  onCategoryToggle,
  onToggleShowSavedOnly,
  children,
}: Pick<
  DiscoverPanelProps,
  | 'selectedCategories'
  | 'categoryOptions'
  | 'showSavedOnly'
  | 'onCategoryToggle'
  | 'onToggleShowSavedOnly'
  | 'children'
>) {
  return (
    <div className="discover-filters-panel__content">
      <CategoryFilter
        selectedCategories={selectedCategories}
        categoryOptions={categoryOptions}
        onCategoryToggle={onCategoryToggle}
        hideLabel
        compact
        collapsibleGroups
      />

      <div className="filter-actions filter-actions--compact">
        <button
          type="button"
          className={
            showSavedOnly
              ? 'saved-toggle-button saved-toggle-button--active'
              : 'saved-toggle-button'
          }
          onClick={onToggleShowSavedOnly}
          aria-pressed={showSavedOnly}
        >
          {showSavedOnly ? '★ Saved only' : '☆ Show saved'}
        </button>
      </div>

      {children}
    </div>
  )
}

export default function DiscoverPanel({
  searchTerm,
  selectedCategories,
  categoryOptions,
  showSavedOnly,
  showClearFiltersButton,
  onSearchChange,
  onCategoryToggle,
  onToggleShowSavedOnly,
  onClearFilters,
  resultCount,
  extraFilterChips = [],
  children,
  variant = 'discover',
}: DiscoverPanelProps) {
  const sheetTitleId = useId()
  const isMobile = useMediaQuery('(max-width: 760px)')
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    showSavedOnly ||
    extraFilterChips.length > 0

  const [filtersOpen, setFiltersOpen] = useState(() =>
    getInitialDesktopFiltersOpen(hasActiveFilters),
  )
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  const selectedChips: DiscoverFilterChip[] = selectedCategories.map(
    (category) => ({
      id: `category-${category}`,
      label: category,
      onRemove: () => onCategoryToggle(category),
    }),
  )

  if (showSavedOnly) {
    selectedChips.push({
      id: 'saved-only',
      label: 'Saved only',
      onRemove: onToggleShowSavedOnly,
    })
  }

  selectedChips.push(...extraFilterChips)

  const activeFilterCount = selectedChips.length
  const filterButtonLabel = getActiveFilterCountLabel(activeFilterCount)
  const showChipRow = selectedChips.length > 0

  function handleClearAll() {
    onClearFilters()
    setFiltersOpen(false)
    setMobileSheetOpen(false)
    if (!isMobile) {
      writeDiscoverFiltersOpenState(false)
    }
  }

  function handleFiltersToggle() {
    if (isMobile) {
      setMobileSheetOpen(true)
      return
    }

    setFiltersOpen((current) => {
      const next = !current
      writeDiscoverFiltersOpenState(next)
      return next
    })
  }

  return (
    <section
      className={
        variant === 'search'
          ? 'discover-panel discover-panel--search'
          : variant === 'home'
            ? 'discover-panel discover-panel--home'
            : 'discover-panel'
      }
    >
      {variant === 'discover' ? (
        <div className="discover-panel__header">
          <div>
            <p className="app-eyebrow">Discover</p>
            <h2>Find your next meal</h2>
          </div>
          {resultCount !== undefined ? (
            <span className="discover-panel__result-count">
              {resultCount} result{resultCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      ) : null}

      {variant === 'home' ? (
        <div className="discover-panel__header discover-panel__header--home">
          <div>
            <p className="app-eyebrow">Your kitchen</p>
            <h2>Plan, save, and cook</h2>
          </div>
          {resultCount !== undefined ? (
            <span className="discover-panel__result-count">
              {resultCount} preview{resultCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      ) : null}

      <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />

      <div className="discover-panel__toolbar">
        <button
          type="button"
          className={
            hasActiveFilters || filtersOpen || mobileSheetOpen
              ? 'discover-filters-toggle discover-filters-toggle--active'
              : 'discover-filters-toggle'
          }
          onClick={handleFiltersToggle}
          aria-expanded={isMobile ? mobileSheetOpen : filtersOpen}
          aria-controls={isMobile ? undefined : 'discover-filters-panel'}
          aria-label={getFiltersToggleAriaLabel(activeFilterCount, isMobile)}
          data-testid="discover-filters-toggle"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span data-testid="discover-filters-toggle-label">{filterButtonLabel}</span>
        </button>

        {variant === 'search' && resultCount !== undefined ? (
          <span className="discover-panel__result-count discover-panel__result-count--inline">
            {resultCount} result{resultCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {showChipRow ? (
        <div className="discover-panel__chips" data-testid="discover-filter-chips">
          <span className="discover-panel__chips-label">Selected:</span>
          {selectedChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="filter-chip"
              onClick={chip.onRemove}
              aria-label={`Remove ${chip.label} filter`}
            >
              <span className="filter-chip__label">{chip.label}</span>
              <X size={14} aria-hidden="true" />
            </button>
          ))}
          {showClearFiltersButton ? (
            <button
              type="button"
              className="filter-chip filter-chip--clear"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      {!isMobile ? (
        <div
          id="discover-filters-panel"
          className={
            filtersOpen
              ? 'discover-filters-panel discover-filters-panel--open'
              : 'discover-filters-panel'
          }
          data-testid="discover-filters-panel"
        >
          <DiscoverFilterContent
            selectedCategories={selectedCategories}
            categoryOptions={categoryOptions}
            showSavedOnly={showSavedOnly}
            onCategoryToggle={onCategoryToggle}
            onToggleShowSavedOnly={onToggleShowSavedOnly}
          >
            {children}
          </DiscoverFilterContent>
        </div>
      ) : null}

      <Modal
        isOpen={isMobile && mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        labelledBy={sheetTitleId}
        overlayClassName="filter-sheet-overlay"
        contentClassName="filter-sheet"
      >
        <div className="filter-sheet__header">
          <h2 id={sheetTitleId} className="filter-sheet__title">
            Filters
          </h2>
          <button
            type="button"
            className="filter-sheet__close"
            onClick={() => setMobileSheetOpen(false)}
            aria-label="Close filters"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <DiscoverFilterContent
          selectedCategories={selectedCategories}
          categoryOptions={categoryOptions}
          showSavedOnly={showSavedOnly}
          onCategoryToggle={onCategoryToggle}
          onToggleShowSavedOnly={onToggleShowSavedOnly}
        >
          {children}
        </DiscoverFilterContent>

        {showClearFiltersButton ? (
          <button
            type="button"
            className="filter-sheet__clear"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        ) : null}
      </Modal>
    </section>
  )
}
