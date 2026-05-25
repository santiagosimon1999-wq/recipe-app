import { RECIPE_FILTER_CATEGORIES } from '../utils/categories'

type CategoryFilterProps = {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="category-filter">
      <p className="category-filter__label">Filter by category</p>

      <div className="category-filter__buttons">
        {RECIPE_FILTER_CATEGORIES.map((category) => (
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
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter