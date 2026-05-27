import { describe, expect, it, vi } from 'vitest'
import type { Recipe } from '../types/Recipe'
import {
  getRecipeListKey,
  getSupabaseRecipeId,
  isCloudRecipe,
  isRecipeFavorited,
  isSampleRecipe,
  normalizeSupabaseRecipeId,
  parseDbRecipeId,
} from './favorites'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 1,
    title: 'Test',
    image: '',
    description: '',
    category: 'All',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: [],
    instructions: '',
    likeCount: 0,
    liked: false,
    ...overrides,
  }
}

describe('parseDbRecipeId', () => {
  it('parses positive integers from numbers and numeric strings', () => {
    expect(parseDbRecipeId(42)).toBe(42)
    expect(parseDbRecipeId('42')).toBe(42)
    expect(parseDbRecipeId('42.9')).toBe(42)
  })

  it('rejects invalid ids', () => {
    expect(parseDbRecipeId(0)).toBeNull()
    expect(parseDbRecipeId(-1)).toBeNull()
    expect(parseDbRecipeId('abc')).toBeNull()
    expect(parseDbRecipeId(null)).toBeNull()
  })
})

describe('getRecipeListKey', () => {
  it('prefixes source so sample and db ids never collide', () => {
    expect(getRecipeListKey(makeRecipe({ id: 5, source: 'sample' }))).toBe(
      'sample-5'
    )
    expect(getRecipeListKey(makeRecipe({ id: 5, source: 'user' }))).toBe(
      'user-5'
    )
  })
})

describe('isSampleRecipe / isCloudRecipe', () => {
  it('classifies recipe sources', () => {
    expect(isSampleRecipe(makeRecipe({ source: 'sample' }))).toBe(true)
    expect(isCloudRecipe(makeRecipe({ source: 'community' }))).toBe(true)
    expect(isCloudRecipe(makeRecipe({ source: 'user' }))).toBe(true)
    expect(isCloudRecipe(makeRecipe({ source: 'sample' }))).toBe(false)
  })
})

describe('isRecipeFavorited', () => {
  it('checks sample favorites by sample id list', () => {
    const sample = makeRecipe({ id: 3, source: 'sample' })
    expect(isRecipeFavorited(sample, [3], [])).toBe(true)
    expect(isRecipeFavorited(sample, [4], [])).toBe(false)
  })

  it('checks cloud favorites by parsed db id', () => {
    const dbRecipe = makeRecipe({ id: 10, source: 'community' })
    expect(isRecipeFavorited(dbRecipe, [], [10])).toBe(true)
    expect(isRecipeFavorited(dbRecipe, [], [11])).toBe(false)
  })
})

describe('getSupabaseRecipeId', () => {
  it('returns null for sample recipes', () => {
    expect(getSupabaseRecipeId(makeRecipe({ source: 'sample', id: 1 }))).toBeNull()
  })

  it('returns parsed id for cloud recipes', () => {
    expect(getSupabaseRecipeId(makeRecipe({ source: 'user', id: 7 }))).toBe(7)
  })

  it('logs and returns null for unknown source', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      getSupabaseRecipeId(makeRecipe({ source: undefined, id: 1 }))
    ).toBeNull()
    errorSpy.mockRestore()
  })
})

describe('normalizeSupabaseRecipeId', () => {
  it('returns a valid positive id', () => {
    expect(normalizeSupabaseRecipeId(12)).toBe(12)
  })

  it('throws for invalid ids', () => {
    expect(() => normalizeSupabaseRecipeId(0)).toThrow(/Invalid recipe id/)
  })
})
