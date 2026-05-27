import { describe, expect, it } from 'vitest'
import { getRecipeSharePath, recipeSupportsSharing } from './recipeShare'
import type { Recipe } from '../types/Recipe'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 42,
    title: 'Test',
    image: '',
    imageFile: null,
    description: '',
    category: 'Other',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: [],
    instructions: '',
    source: 'community',
    likeCount: 0,
    liked: false,
    ...overrides,
  }
}

describe('recipeShare', () => {
  it('builds a stable share path', () => {
    expect(getRecipeSharePath(42)).toBe('/recipes/42')
  })

  it('allows sharing for cloud recipes with valid ids', () => {
    expect(recipeSupportsSharing(makeRecipe({ source: 'community', id: 5 }))).toBe(
      true
    )
  })

  it('disallows sharing for legacy sample source', () => {
    expect(recipeSupportsSharing(makeRecipe({ source: 'sample', id: 1 }))).toBe(
      false
    )
  })
})
