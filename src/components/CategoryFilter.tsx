import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { CategoryGroupKey } from '../types/Category'
import {
  getCategoryOption,
  RECIPE_FILTER_CATEGORIES,
  type CategoryOption,
} from '../utils/categories'
import { isCategoryGroupExpanded } from '../lib/discoverFilters'

type CategoryFilterProps = {
  selectedCategories: string[]
  categoryOptions?: Record<CategoryGroupKey, CategoryOption[]>
  onCategoryToggle: (category: string) => void
  hideLabel?: boolean
  compact?: boolean
  collapsibleGroups?: boolean
}

function CategoryFilter({
  selectedCategories,
  categoryOptions,
  onCategoryToggle,
  hideLabel = false,
  compact = false,
  collapsibleGroups = false,
}: CategoryFilterProps) {
  const [expandedGroups, setExpandedGroups] = useState<
    Partial<Record<CategoryGroupKey, boolean>>
  >({})

  const groupedEntries =
    categoryOptions && Object.values(categoryOptions).some((group) => group.length > 0)
      ? (Object.entries(categoryOptions) as Array<
          [CategoryGroupKey, CategoryOption[]]
        >).filter(([, options]) => options.length > 0)
      : null

  const rootClassName = [
    'category-filter',
    compact ? 'category-filter--compact' : '',
    collapsibleGroups ? 'category-filter--collapsible' : '',
  ]
    .filter(Boolean)
    .join(' ')

  function toggleGroup(groupKey: CategoryGroupKey) {
    setExpandedGroups((current) => {
      const options =
        groupedEntries?.find(([key]) => key === groupKey)?.[1] ?? []
      const isExpanded = isCategoryGroupExpanded(
        groupKey,
        options,
        selectedCategories,
        current,
      )
      return { ...current, [groupKey]: !isExpanded }
    })
  }

  return (
    <div className={rootClassName}>
      {hideLabel ? null : (
        <p className="category-filter__label">Filter by category</p>
      )}

      {groupedEntries ? (
        <div className="category-filter__groups">
          <div className="category-filter__buttons">
            <button
              key="All"
              type="button"
              className={
                selectedCategories.length === 0
                  ? 'category-filter__button category-filter__button--active'
                  : 'category-filter__button'
              }
              onClick={() => onCategoryToggle('All')}
              aria-pressed={selectedCategories.length === 0}
            >
              <span>All</span>
            </button>
          </div>

          {groupedEntries.map(([groupKey, options]) => {
            const groupLabel = options[0]?.groupLabel ?? groupKey
            const isExpanded = collapsibleGroups
              ? isCategoryGroupExpanded(
                  groupKey,
                  options,
                  selectedCategories,
                  expandedGroups,
                )
              : true

            return (
              <div
                key={groupKey}
                className={
                  collapsibleGroups
                    ? 'category-filter__group category-filter__group--collapsible'
                    : 'category-filter__group'
                }
                data-testid={`category-filter-group-${groupKey}`}
              >
                {collapsibleGroups ? (
                  <button
                    type="button"
                    className="category-filter__group-toggle"
                    onClick={() => toggleGroup(groupKey)}
                    aria-expanded={isExpanded}
                    aria-controls={`category-filter-group-panel-${groupKey}`}
                    data-testid={`category-filter-group-toggle-${groupKey}`}
                  >
                    <span>{groupLabel}</span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={
                        isExpanded
                          ? 'category-filter__group-chevron category-filter__group-chevron--open'
                          : 'category-filter__group-chevron'
                      }
                    />
                  </button>
                ) : (
                  <p className="category-filter__group-label">{groupLabel}</p>
                )}

                {isExpanded ? (
                  <div
                    id={`category-filter-group-panel-${groupKey}`}
                    className="category-filter__buttons"
                  >
                    {options.map((option) => (
                      <button
                        key={option.name}
                        type="button"
                        className={
                          selectedCategories.includes(option.name)
                            ? 'category-filter__button category-filter__button--active'
                            : 'category-filter__button'
                        }
                        onClick={() => onCategoryToggle(option.name)}
                        aria-pressed={selectedCategories.includes(option.name)}
                      >
                        {option.icon ? (
                          <span aria-hidden="true">{option.icon}</span>
                        ) : null}
                        <span>{option.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="category-filter__buttons">
          {RECIPE_FILTER_CATEGORIES.map((category) => {
            const categoryOption = getCategoryOption(category)
            const icon = categoryOption?.icon
            const isActive =
              category === 'All'
                ? selectedCategories.length === 0
                : selectedCategories.includes(category)
            return (
              <button
                key={category}
                type="button"
                className={
                  isActive
                    ? 'category-filter__button category-filter__button--active'
                    : 'category-filter__button'
                }
                onClick={() => onCategoryToggle(category)}
                aria-pressed={isActive}
              >
                {icon ? <span aria-hidden="true">{icon}</span> : null}
                <span>{category}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CategoryFilter
