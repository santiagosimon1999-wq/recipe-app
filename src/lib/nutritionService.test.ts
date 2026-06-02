import { describe, expect, it } from 'vitest'
import { getIngredientAliasCount } from './ingredientAliases'
import {
  calculateNutrition,
  debugParseIngredients,
  getNutritionCoverageReport,
  getSupportedIngredientCount,
} from './nutritionService'

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
    expect(parsed.skippedReason).toBe('unmatched')
  })

  it('strips prep words when matching ingredient names', () => {
    const [parsed] = debugParseIngredients(['1 cup chopped spinach'])
    expect(parsed.matchedKey).toBe('spinach')
    expect(parsed.unit).toBe('cup')
  })

  it('matches spanish aliases with accents and plural forms', () => {
    const parsed = debugParseIngredients([
      '2 pechugas de pollo',
      '1 taza de arroz blanco',
      '100g carne molida',
      'huevos revueltos',
      '1 plátano',
    ])

    expect(parsed[0].matchedKey).toBe('chicken breast')
    expect(parsed[1].matchedKey).toBe('white rice')
    expect(parsed[1].unit).toBe('taza')
    expect(parsed[2].matchedKey).toBe('ground beef')
    expect(parsed[3].matchedKey).toBe('egg')
    expect(parsed[4].matchedKey).toBe('banana')
  })

  it('ignores section headers used in spanish recipe blocks', () => {
    const parsed = debugParseIngredients([
      'Para el caldo',
      'Para el ramen',
      'Para marinar los huevos',
    ])

    expect(parsed[0].skippedReason).toBe('section-header')
    expect(parsed[1].skippedReason).toBe('section-header')
    expect(parsed[2].skippedReason).toBe('section-header')
  })

  it('normalizes unicode fractions and extra text wrappers', () => {
    const [salt, eggs] = debugParseIngredients([
      '½ tsp sal (opcional, al gusto)',
      '¼ huevos',
    ])

    expect(salt.amount).toBe(0.5)
    expect(eggs.amount).toBe(0.25)
    expect(eggs.matchedKey).toBe('egg')
  })

  it('matches mixed-number unicode fractions', () => {
    const [parsed] = debugParseIngredients(['1½ taza de arroz blanco'])
    expect(parsed.amount).toBe(1.5)
    expect(parsed.matchedKey).toBe('white rice')
  })

  it('maps ramen-style spanish ingredients to supported nutrition keys', () => {
    const parsed = debugParseIngredients([
      'costillas de cerdo',
      'salsa de soja',
      'aceite de sésamo',
      'cebollines',
      'huevos',
      'fideos para ramen',
      'dumplings',
      'mirin',
    ])

    expect(parsed.map((item) => item.matchedKey)).toEqual([
      'pork ribs',
      'soy sauce',
      'sesame oil',
      'green onion',
      'egg',
      'ramen noodles',
      'dumplings',
      'mirin',
    ])
  })

  describe('south american recipes', () => {
    it('matches south american staples and meats', () => {
      const parsed = debugParseIngredients([
        '1 taza de arroz integral',
        '1 taza de porotos',
        '1 taza de quinua',
        '1 yuca',
        '1 plátano maduro',
        '1 arepa',
        '2 cucharadas harina PAN',
        '200g bistec',
        '100g lomo',
        '100g entraña',
        '150g muslo de pollo',
        '100g queso fresco',
      ])

      expect(parsed.map((item) => item.matchedKey)).toEqual([
        'brown rice',
        'beans',
        'quinoa',
        'cassava',
        'ripe plantain',
        'arepa',
        'precooked corn flour',
        'beef steak',
        'pork loin',
        'skirt steak',
        'chicken thigh',
        'fresh cheese',
      ])
    })
  })

  describe('caribbean recipes', () => {
    it('matches caribbean ingredients and proteins', () => {
      const parsed = debugParseIngredients([
        'green plantain',
        'cassava',
        'saltfish',
        'goat meat',
        'jerk chicken',
        '1 cup coconut milk',
        '1 cup pigeon peas',
        '1 cup red beans',
        'oxtail',
        'breadfruit',
        'callaloo',
      ])

      expect(parsed.map((item) => item.matchedKey)).toEqual([
        'green plantain',
        'cassava',
        'saltfish',
        'goat meat',
        'jerk chicken',
        'coconut milk',
        'pigeon peas',
        'red beans',
        'oxtail',
        'breadfruit',
        'callaloo',
      ])
    })
  })

  describe('asian recipes', () => {
    it('matches asian pantry and noodle ingredients', () => {
      const parsed = debugParseIngredients([
        'ramen noodles',
        'udon noodles',
        'soba noodles',
        'rice noodles',
        'dumplings',
        'gyoza',
        'wonton',
        'tofu',
        'miso',
        'dark soy sauce',
        'sesame oil',
        'mirin',
        'sake',
        'bok choy',
        'napa cabbage',
        'shiitake mushrooms',
        'enoki mushrooms',
        'ginger',
        'scallions',
        'kimchi',
        'gochujang',
        'curry paste',
        'jasmine rice',
        'sticky rice',
      ])

      expect(parsed.map((item) => item.matchedKey)).toEqual([
        'ramen noodles',
        'udon noodles',
        'soba noodles',
        'rice noodles',
        'dumplings',
        'gyoza',
        'wonton',
        'tofu',
        'miso',
        'dark soy sauce',
        'sesame oil',
        'mirin',
        'sake',
        'bok choy',
        'napa cabbage',
        'shiitake mushrooms',
        'enoki mushrooms',
        'ginger',
        'green onion',
        'kimchi',
        'gochujang',
        'curry paste',
        'jasmine rice',
        'sticky rice',
      ])
    })
  })

  describe('mixed-language recipes', () => {
    it('matches mixed spanish/english phrases with longest-name priority', () => {
      const parsed = debugParseIngredients([
        '2 pechuga de pollo with sesame oil',
        '1 taza arroz blanco',
        '1 cup salsa de soja',
        '2 green onions / cebollines',
        '1 fideos ramen',
      ])

      expect(parsed[0].matchedKey).toBe('chicken breast')
      expect(parsed[1].matchedKey).toBe('white rice')
      expect(parsed[2].matchedKey).toBe('soy sauce')
      expect(parsed[3].matchedKey).toBe('green onion')
      expect(parsed[4].matchedKey).toBe('ramen noodles')
    })
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

  it('estimates macros from spanish ingredient phrases', async () => {
    const totals = await calculateNutrition([
      '2 pechugas de pollo',
      '1 taza de arroz blanco',
      '100g carne molida',
      'huevos revueltos',
      '1 taza de frijoles',
      '1 cucharada de aceite de oliva',
    ])

    // Main assertion is that all phrases are recognized and aggregated.
    expect(totals.calories).toBeGreaterThan(0)
    expect(totals.protein).toBeGreaterThan(0)
    expect(totals.carbs).toBeGreaterThan(0)
    expect(totals.fat).toBeGreaterThan(0)
  })

  it('estimates macros for ramen-style spanish ingredient list', async () => {
    const totals = await calculateNutrition([
      'costillas de cerdo',
      'salsa de soja',
      'aceite de sésamo',
      'cebollines',
      'huevos',
      'fideos para ramen',
      'dumplings',
      'mirin',
    ])

    expect(totals.calories).toBeGreaterThan(0)
    expect(totals.protein).toBeGreaterThan(0)
    expect(totals.carbs).toBeGreaterThan(0)
    expect(totals.fat).toBeGreaterThan(0)
  })

  it('estimates macros for south american ingredient list', async () => {
    const totals = await calculateNutrition([
      '1 taza de arroz integral',
      '1 taza de lentejas',
      '150g pechuga de pollo',
      '1 cucharada de aceite de oliva',
      '1 arepa',
      '1 plátano maduro',
    ])

    expect(totals.calories).toBeGreaterThan(0)
    expect(totals.protein).toBeGreaterThan(0)
    expect(totals.carbs).toBeGreaterThan(0)
    expect(totals.fat).toBeGreaterThan(0)
  })

  it('estimates macros for caribbean ingredient list', async () => {
    const totals = await calculateNutrition([
      'green plantain',
      'cassava',
      'saltfish',
      'goat meat',
      '1 cup coconut milk',
      '1 cup pigeon peas',
    ])

    expect(totals.calories).toBeGreaterThan(0)
    expect(totals.protein).toBeGreaterThan(0)
    expect(totals.carbs).toBeGreaterThan(0)
    expect(totals.fat).toBeGreaterThan(0)
  })

  it('estimates macros for asian ingredient list', async () => {
    const totals = await calculateNutrition([
      'ramen noodles',
      'tofu',
      '1 tbsp miso',
      '1 tbsp dark soy sauce',
      '1 tbsp sesame oil',
      '1 cup bok choy',
      'kimchi',
    ])

    expect(totals.calories).toBeGreaterThan(0)
    expect(totals.protein).toBeGreaterThan(0)
    expect(totals.carbs).toBeGreaterThan(0)
    expect(totals.fat).toBeGreaterThan(0)
  })
})

describe('nutrition coverage metadata', () => {
  it('exposes counts for supported ingredients and aliases', () => {
    expect(getSupportedIngredientCount()).toBeGreaterThanOrEqual(300)
    expect(getIngredientAliasCount()).toBeGreaterThanOrEqual(500)
  })

  it('exposes category coverage and successful match examples', () => {
    const report = getNutritionCoverageReport([
      'pechuga de pollo',
      'arroz blanco',
      'frijoles negros',
      'aceite de sésamo',
    ])

    expect(report.totalIngredients).toBeGreaterThanOrEqual(300)
    expect(report.totalAliases).toBeGreaterThanOrEqual(500)
    expect(report.categoryCoverage.proteins).toBeGreaterThan(0)
    expect(report.categoryCoverage.grains_starches).toBeGreaterThan(0)
    expect(report.categoryCoverage.vegetables).toBeGreaterThan(0)
    expect(report.categoryCoverage.legumes).toBeGreaterThan(0)
    expect(report.categoryCoverage.fruits).toBeGreaterThan(0)
    expect(report.categoryCoverage.dairy).toBeGreaterThan(0)
    expect(report.categoryCoverage.oils_sauces).toBeGreaterThan(0)
    expect(report.successfulMatches.map((item) => item.matchedKey)).toEqual([
      'chicken breast',
      'white rice',
      'black beans',
      'sesame oil',
    ])
  })
})
