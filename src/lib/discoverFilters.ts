import type { CategoryGroupKey } from '../types/Category'
import type { CategoryOption } from '../utils/categories'

export const DISCOVER_FILTERS_OPEN_STORAGE_KEY = 'savora-discover-filters-open'

/** Groups expanded by default when no selection applies in that group. */
export const DEFAULT_EXPANDED_CATEGORY_GROUPS: CategoryGroupKey[] = ['meal_type']

export function getActiveFilterCountLabel(count: number): string {
  if (count <= 0) return 'Filters'
  if (count === 1) return '1 filter'
  return `${count} filters`
}

export function getFiltersToggleAriaLabel(
  count: number,
  isMobile: boolean,
): string {
  const countLabel = getActiveFilterCountLabel(count)
  const action = isMobile ? 'Open filters' : 'Toggle filters'
  if (count === 0) return action
  return `${countLabel}, ${action}`
}

export function readDiscoverFiltersOpenState(): boolean | null {
  try {
    const value = sessionStorage.getItem(DISCOVER_FILTERS_OPEN_STORAGE_KEY)
    if (value === 'true') return true
    if (value === 'false') return false
    return null
  } catch {
    return null
  }
}

export function writeDiscoverFiltersOpenState(isOpen: boolean): void {
  try {
    sessionStorage.setItem(DISCOVER_FILTERS_OPEN_STORAGE_KEY, String(isOpen))
  } catch {
    // Ignore unavailable or blocked storage.
  }
}

export function categoryGroupHasSelection(
  options: CategoryOption[],
  selectedCategories: string[],
): boolean {
  return options.some((option) => selectedCategories.includes(option.name))
}

export function isCategoryGroupExpanded(
  groupKey: CategoryGroupKey,
  options: CategoryOption[],
  selectedCategories: string[],
  userExpanded: Partial<Record<CategoryGroupKey, boolean>>,
): boolean {
  if (userExpanded[groupKey] !== undefined) {
    return userExpanded[groupKey] === true
  }

  if (categoryGroupHasSelection(options, selectedCategories)) {
    return true
  }

  return DEFAULT_EXPANDED_CATEGORY_GROUPS.includes(groupKey)
}
