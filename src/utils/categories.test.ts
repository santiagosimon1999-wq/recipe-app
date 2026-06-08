import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types/Recipe'
import {
  dedupeCategoryNames,
  getPrimaryCategory,
  getRecipeCategoryNames,
  recipeMatchesSelectedCategories,
  recipeMatchesSelectedCategory,
  resolveLegacyCategoryNames,
  toggleSelectedCategories,
} from './categories'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 1,
    title: 'Test',
    image: '',
    description: 'Desc',
    category: 'Dinner',
    categories: ['Dinner'],
    calories: 10,
    protein: 1,
    carbs: 2,
    fat: 3,
    ingredients: ['egg'],
    instructions: 'Cook',
    likeCount: 0,
    liked: false,
    ...overrides,
  }
}

describe('categories utils', () => {
  it('maps legacy categories to modern categories', () => {
    expect(resolveLegacyCategoryNames('Desserts')).toEqual(['Dessert'])
    expect(resolveLegacyCategoryNames('Soups and Stews')).toEqual(['Soup'])
    expect(resolveLegacyCategoryNames('unknown-value')).toEqual(['Other'])
  })

  it('dedupes and normalizes category names', () => {
    expect(dedupeCategoryNames(['Dinner', 'dinner', 'Italian'])).toEqual([
      'Dinner',
      'Italian',
    ])
  })

  it('prefers meal type as primary category', () => {
    expect(getPrimaryCategory(['Italian', 'Dinner', 'High Protein'])).toBe(
      'Dinner'
    )
  })

  it('falls back to legacy category mapping when categories are missing', () => {
    const recipe = makeRecipe({ categories: undefined, category: 'Desserts' })
    expect(getRecipeCategoryNames(recipe)).toEqual(['Dessert'])
  })

  it('matches selected category against multi-category recipes', () => {
    const recipe = makeRecipe({
      category: 'Dinner',
      categories: ['Dinner', 'Italian', 'High Protein'],
    })

    expect(recipeMatchesSelectedCategory(recipe, 'All')).toBe(true)
    expect(recipeMatchesSelectedCategory(recipe, 'Italian')).toBe(true)
    expect(recipeMatchesSelectedCategory(recipe, 'Vegan')).toBe(false)
  })

  it('matches all selected categories with AND logic', () => {
    const recipe = makeRecipe({
      category: 'Dinner',
      categories: ['Dinner', 'Italian', 'High Protein'],
    })

    expect(recipeMatchesSelectedCategories(recipe, [])).toBe(true)
    expect(recipeMatchesSelectedCategories(recipe, ['Dinner', 'Italian'])).toBe(
      true,
    )
    expect(
      recipeMatchesSelectedCategories(recipe, ['Dinner', 'Vegan']),
    ).toBe(false)
  })

  it('toggles categories and replaces same-group selections', () => {
    expect(toggleSelectedCategories([], 'Breakfast')).toEqual(['Breakfast'])
    expect(
      toggleSelectedCategories(['Breakfast'], 'Italian'),
    ).toEqual(['Breakfast', 'Italian'])
    expect(
      toggleSelectedCategories(['Breakfast', 'Italian'], 'Lunch'),
    ).toEqual(['Italian', 'Lunch'])
    expect(
      toggleSelectedCategories(['Lunch', 'Italian'], 'Italian'),
    ).toEqual(['Lunch'])
    expect(toggleSelectedCategories(['Lunch'], 'All')).toEqual([])
  })
})
