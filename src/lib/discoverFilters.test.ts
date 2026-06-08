import { describe, expect, it } from 'vitest'
import {
  getActiveFilterCountLabel,
  getFiltersToggleAriaLabel,
  isCategoryGroupExpanded,
} from './discoverFilters'
import type { CategoryOption } from '../utils/categories'

const cuisineOptions: CategoryOption[] = [
  {
    name: 'Italian',
    slug: 'italian',
    icon: '🍝',
    groupKey: 'cuisine',
    groupLabel: 'Cuisine',
  },
]

describe('discoverFilters', () => {
  it('formats active filter count labels', () => {
    expect(getActiveFilterCountLabel(0)).toBe('Filters')
    expect(getActiveFilterCountLabel(1)).toBe('1 filter')
    expect(getActiveFilterCountLabel(3)).toBe('3 filters')
  })

  it('builds accessible toggle labels with active counts', () => {
    expect(getFiltersToggleAriaLabel(0, false)).toBe('Toggle filters')
    expect(getFiltersToggleAriaLabel(2, true)).toBe('2 filters, Open filters')
  })

  it('expands cuisine when that category is selected', () => {
    expect(
      isCategoryGroupExpanded('cuisine', cuisineOptions, ['Italian'], {}),
    ).toBe(true)
  })

  it('collapses cuisine by default without a selection', () => {
    expect(isCategoryGroupExpanded('cuisine', cuisineOptions, [], {})).toBe(
      false,
    )
  })

  it('keeps meal type expanded by default', () => {
    expect(
      isCategoryGroupExpanded(
        'meal_type',
        [
          {
            name: 'Breakfast',
            slug: 'breakfast',
            icon: '☀️',
            groupKey: 'meal_type',
            groupLabel: 'Meal Type',
          },
        ],
        [],
        {},
      ),
    ).toBe(true)
  })
})
