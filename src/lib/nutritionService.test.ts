import { describe, expect, it } from 'vitest'
import { calculateNutrition, debugParseIngredients } from './nutritionService'

describe('debugParseIngredients', () => {
  it('parses count-based ingredients', () => {
    const [parsed] = debugParseIngredients(['2 eggs'])
    expect(parsed.matchedKey).toBe('eggs')
    expect(parsed.amount).toBe(2)
    expect(parsed.applied?.calories).toBe(156)
  })

  it('parses gram-based proteins', () => {
    const [parsed] = debugParseIngredients(['200g chicken breast'])
    expect(parsed.matchedKey).toBe('chicken breast')
    expect(parsed.basis).toBe('100g')
    expect(parsed.multiplier).toBe(2)
    expect(parsed.applied?.calories).toBe(330)
  })

  it('returns null applied nutrition for unknown ingredients', () => {
    const [parsed] = debugParseIngredients(['1 quince blossom'])
    expect(parsed.matchedKey).toBeNull()
    expect(parsed.applied).toBeNull()
  })

  it('strips prep words when matching ingredient names', () => {
    const [parsed] = debugParseIngredients(['1 cup chopped spinach'])
    expect(parsed.matchedKey).toBe('spinach')
    expect(parsed.unit).toBe('cup')
  })
})

describe('calculateNutrition', () => {
  it('sums known ingredients and ignores unknown ones', async () => {
    const totals = await calculateNutrition([
      '2 eggs',
      '1 tbsp olive oil',
      '1 mystery spice',
    ])

    expect(totals.calories).toBe(156 + 119)
    expect(totals.protein).toBe(12.6)
    expect(totals.fat).toBe(24.1)
  })

  it('returns zeros for an empty ingredient list', async () => {
    const totals = await calculateNutrition([])
    expect(totals).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    })
  })

  it('converts tablespoons to teaspoons for tsp-basis ingredients', async () => {
    const totals = await calculateNutrition(['3 tbsp salt'])
    expect(totals.calories).toBe(0)
  })
})
