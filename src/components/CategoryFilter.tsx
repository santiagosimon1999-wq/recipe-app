import { getCategoryOption, RECIPE_FILTER_CATEGORIES } from '../utils/categories'
import type { CategoryGroupKey } from '../types/Category'
import type { CategoryOption } from '../utils/categories'

type CategoryFilterProps = {
  selectedCategory: string
  categoryOptions?: Record<CategoryGroupKey, CategoryOption[]>
  onCategoryChange: (category: string) => void
}

function CategoryFilter({
  selectedCategory,
  categoryOptions,
  onCategoryChange,
}: CategoryFilterProps) {
  const groupedEntries =
    categoryOptions && Object.values(categoryOptions).some((group) => group.length > 0)
      ? (Object.entries(categoryOptions) as Array<
          [CategoryGroupKey, CategoryOption[]]
        >).filter(([, options]) => options.length > 0)
      : null

  return (
    <div className="category-filter">
      <p className="category-filter__label">Filter by category</p>

      {groupedEntries ? (
        <div className="category-filter__groups">
          <div className="category-filter__buttons">
            <button
              key="All"
              type="button"
              className={
                selectedCategory === 'All'
                  ? 'category-filter__button category-filter__button--active'
                  : 'category-filter__button'
              }
              onClick={() => onCategoryChange('All')}
            >
              <span>All</span>
            </button>
          </div>

          {groupedEntries.map(([groupKey, options]) => (
            <div key={groupKey} className="category-filter__group">
              <p className="category-filter__group-label">{options[0]?.groupLabel}</p>
              <div className="category-filter__buttons">
                {options.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    className={
                      selectedCategory === option.name
                        ? 'category-filter__button category-filter__button--active'
                        : 'category-filter__button'
                    }
                    onClick={() => onCategoryChange(option.name)}
                  >
                    {option.icon ? <span aria-hidden="true">{option.icon}</span> : null}
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="category-filter__buttons">
          {RECIPE_FILTER_CATEGORIES.map((category) => {
            const categoryOption = getCategoryOption(category)
            const icon = categoryOption?.icon
            return (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? 'category-filter__button category-filter__button--active'
                    : 'category-filter__button'
                }
                onClick={() => onCategoryChange(category)}
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