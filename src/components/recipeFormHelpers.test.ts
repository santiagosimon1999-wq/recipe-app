import { describe, expect, it } from 'vitest'
import {
  getNutritionEstimateFeedback,
  getSubmitButtonLabel,
  RECIPE_FORM_HINTS,
  validateRecipeFormFields,
} from './recipeFormHelpers'

describe('validateRecipeFormFields', () => {
  it('returns field-specific messages for missing required values', () => {
    const errors = validateRecipeFormFields({
      title: '',
      description: '  ',
      ingredients: '',
      instructions: '',
      categories: [],
    })

    expect(errors.title).toMatch(/title/i)
    expect(errors.description).toMatch(/description/i)
    expect(errors.ingredients).toMatch(/ingredient/i)
    expect(errors.instructions).toMatch(/instruction/i)
    expect(errors.categories).toMatch(/category/i)
  })

  it('returns no errors when required fields are present', () => {
    const errors = validateRecipeFormFields({
      title: 'Pasta',
      description: 'Quick dinner',
      ingredients: '200g pasta',
      instructions: 'Boil\nServe',
      categories: ['Dinner'],
    })

    expect(errors).toEqual({})
  })
})

describe('getNutritionEstimateFeedback', () => {
  it('returns friendly error copy when nothing could be estimated', () => {
    const feedback = getNutritionEstimateFeedback(
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
      [
        {
          original: '1 mystery fruit',
          normalizedName: 'mystery fruit',
          amount: 1,
          unit: null,
          matchedKey: null,
          basis: null,
          multiplier: 0,
          applied: null,
          skippedReason: 'unmatched',
        },
      ]
    )

    expect(feedback?.kind).toBe('error')
    expect(feedback?.message).toBe(RECIPE_FORM_HINTS.nutritionEstimateError)
  })

  it('returns warning when some ingredients could not be matched', () => {
    const feedback = getNutritionEstimateFeedback(
      { calories: 156, protein: 12, carbs: 1, fat: 10 },
      [
        {
          original: '2 eggs',
          normalizedName: 'eggs',
          amount: 2,
          unit: null,
          matchedKey: 'eggs',
          basis: 'count',
          multiplier: 2,
          applied: { calories: 156, protein: 12, carbs: 1, fat: 10 },
          skippedReason: null,
        },
        {
          original: '1 quince blossom',
          normalizedName: 'quince blossom',
          amount: 1,
          unit: null,
          matchedKey: null,
          basis: null,
          multiplier: 0,
          applied: null,
          skippedReason: 'unmatched',
        },
      ]
    )

    expect(feedback?.kind).toBe('warning')
    expect(feedback?.message).toMatch(/could not be matched/i)
  })
})

describe('getSubmitButtonLabel', () => {
  it('shows saving labels while submit is in progress', () => {
    expect(getSubmitButtonLabel(false, true)).toBe('Saving…')
    expect(getSubmitButtonLabel(true, true)).toBe('Updating…')
  })
})
