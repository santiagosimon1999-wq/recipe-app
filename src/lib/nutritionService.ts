// src/lib/nutritionService.ts

export type NutritionTotals = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

type NutritionBasis = 'piece' | '100g' | 'cup' | 'tbsp' | 'tsp' | '100ml'

type IngredientNutrition = NutritionTotals & {
  basis: NutritionBasis
}

export type ParsedIngredientDebug = {
  original: string
  normalizedName: string
  amount: number
  unit: string | null
  matchedKey: string | null
  basis: NutritionBasis | null
  multiplier: number
  applied: NutritionTotals | null
}

const INGREDIENT_NUTRITION: Record<string, IngredientNutrition> = {
  egg: { basis: 'piece', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  eggs: { basis: 'piece', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  banana: { basis: 'piece', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  apple: { basis: 'piece', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  tomato: { basis: 'piece', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2 },
  onion: { basis: 'piece', calories: 44, protein: 1.2, carbs: 10.3, fat: 0.1 },
  garlic: { basis: 'piece', calories: 4, protein: 0.2, carbs: 1, fat: 0 },
  carrot: { basis: 'piece', calories: 25, protein: 0.6, carbs: 6, fat: 0.1 },
  potato: { basis: 'piece', calories: 161, protein: 4.3, carbs: 37, fat: 0.2 },
  'sweet potato': {
    basis: 'piece',
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0.1,
  },
  cucumber: { basis: 'piece', calories: 8, protein: 0.3, carbs: 1.9, fat: 0.1 },
  'bell pepper': {
    basis: 'piece',
    calories: 24,
    protein: 1,
    carbs: 6,
    fat: 0.2,
  },
  bread: { basis: 'piece', calories: 80, protein: 3, carbs: 15, fat: 1 },
  tortilla: { basis: 'piece', calories: 140, protein: 4, carbs: 24, fat: 3.5 },

  chicken: { basis: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'chicken breast': {
    basis: '100g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  beef: { basis: '100g', calories: 250, protein: 26, carbs: 0, fat: 15 },
  'ground beef': {
    basis: '100g',
    calories: 332,
    protein: 14,
    carbs: 0,
    fat: 30,
  },
  pork: { basis: '100g', calories: 242, protein: 27, carbs: 0, fat: 14 },
  salmon: { basis: '100g', calories: 208, protein: 20, carbs: 0, fat: 13 },
  tuna: { basis: '100g', calories: 132, protein: 28, carbs: 0, fat: 1.3 },
  shrimp: { basis: '100g', calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  cheese: { basis: '100g', calories: 402, protein: 25, carbs: 1.3, fat: 33 },
  mozzarella: {
    basis: '100g',
    calories: 280,
    protein: 28,
    carbs: 3.1,
    fat: 17,
  },
  cheddar: {
    basis: '100g',
    calories: 403,
    protein: 25,
    carbs: 1.3,
    fat: 33,
  },

  rice: { basis: 'cup', calories: 206, protein: 4.3, carbs: 45, fat: 0.4 },
  'brown rice': {
    basis: 'cup',
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 1.8,
  },
  pasta: { basis: 'cup', calories: 221, protein: 8, carbs: 43, fat: 1.3 },
  spaghetti: { basis: 'cup', calories: 221, protein: 8, carbs: 43, fat: 1.3 },
  oats: { basis: 'cup', calories: 307, protein: 10.7, carbs: 54.8, fat: 5.3 },
  flour: { basis: 'cup', calories: 455, protein: 13, carbs: 95, fat: 1.2 },
  milk: { basis: 'cup', calories: 103, protein: 8, carbs: 12, fat: 2.4 },
  yogurt: { basis: 'cup', calories: 149, protein: 13, carbs: 11.4, fat: 8 },
  broccoli: { basis: 'cup', calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6 },
  spinach: { basis: 'cup', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1 },
  lettuce: { basis: 'cup', calories: 5, protein: 0.5, carbs: 1, fat: 0.1 },
  mushroom: { basis: 'cup', calories: 15, protein: 2.2, carbs: 2.3, fat: 0.2 },
  corn: { basis: 'cup', calories: 96, protein: 3.4, carbs: 21, fat: 1.5 },
  beans: { basis: 'cup', calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
  'black beans': {
    basis: 'cup',
    calories: 132,
    protein: 8.9,
    carbs: 23.7,
    fat: 0.5,
  },
  chickpeas: { basis: 'cup', calories: 269, protein: 14.5, carbs: 45, fat: 4.2 },
  lentils: { basis: 'cup', calories: 230, protein: 17.9, carbs: 39.9, fat: 0.8 },

  butter: { basis: 'tbsp', calories: 102, protein: 0.1, carbs: 0, fat: 11.5 },
  'olive oil': {
    basis: 'tbsp',
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
  },
  oil: { basis: 'tbsp', calories: 119, protein: 0, carbs: 0, fat: 13.5 },
  sugar: { basis: 'tbsp', calories: 49, protein: 0, carbs: 12.6, fat: 0 },
  honey: { basis: 'tbsp', calories: 64, protein: 0.1, carbs: 17.3, fat: 0 },

  salt: { basis: 'tsp', calories: 0, protein: 0, carbs: 0, fat: 0 },
  pepper: { basis: 'tsp', calories: 6, protein: 0.2, carbs: 1.4, fat: 0.1 },

  water: { basis: '100ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
  juice: { basis: '100ml', calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2 },
  broth: { basis: '100ml', calories: 6, protein: 0.5, carbs: 0.4, fat: 0.2 },
}

function emptyTotals(): NutritionTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 }
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function addTotals(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

function scaleTotals(
  totals: NutritionTotals,
  multiplier: number
): NutritionTotals {
  return {
    calories: totals.calories * multiplier,
    protein: totals.protein * multiplier,
    carbs: totals.carbs * multiplier,
    fat: totals.fat * multiplier,
  }
}

function normalizeIngredientText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeIngredientName(value: string): string {
  return value
    .toLowerCase()
    .replace(
      /\b(of|and|fresh|chopped|diced|sliced|minced|large|medium|small|to taste|optional)\b/g,
      ' '
    )
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseFraction(value: string): number | null {
  if (/^\d+\/\d+$/.test(value)) {
    const [numerator, denominator] = value.split('/').map(Number)
    if (!denominator) {
      return null
    }
    return numerator / denominator
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseAmount(raw: string): number | null {
  const parts = raw.trim().split(/\s+/)

  if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+\/\d+$/.test(parts[1])) {
    const whole = Number(parts[0])
    const fraction = parseFraction(parts[1])
    return fraction === null ? null : whole + fraction
  }

  if (parts.length === 1) {
    return parseFraction(parts[0])
  }

  return null
}

function extractAmountAndUnit(ingredient: string): {
  amount: number
  unit: string | null
  name: string
} {
  const normalized = normalizeIngredientText(ingredient)

  const pattern =
    /^(?<amount>\d+\s+\d+\/\d+|\d+\/\d+|\d+(\.\d+)?)\s*(?<unit>cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|grams?|g|kg|ml|l|oz|ounces?|lb|lbs|cloves?|slices?)?\s+(?<name>.+)$/i

  const match = normalized.match(pattern)

  if (match?.groups) {
    const amount = parseAmount(match.groups.amount)
    const unit = match.groups.unit?.toLowerCase() ?? null
    const name = normalizeIngredientName(match.groups.name)

    if (amount && name) {
      return { amount, unit, name }
    }
  }

  return {
    amount: 1,
    unit: null,
    name: normalizeIngredientName(normalized),
  }
}

function findIngredientMatch(name: string): {
  key: string | null
  value: IngredientNutrition | null
} {
  if (INGREDIENT_NUTRITION[name]) {
    return {
      key: name,
      value: INGREDIENT_NUTRITION[name],
    }
  }

  const bestMatch = Object.keys(INGREDIENT_NUTRITION)
    .sort((a, b) => b.length - a.length)
    .find((key) => name.includes(key))

  return {
    key: bestMatch ?? null,
    value: bestMatch ? INGREDIENT_NUTRITION[bestMatch] : null,
  }
}

function normalizeUnitAlias(unit: string | null): string | null {
  if (!unit) {
    return null
  }

  const normalized = unit.toLowerCase()

  if (['tablespoon', 'tablespoons'].includes(normalized)) {
    return 'tbsp'
  }

  if (['teaspoon', 'teaspoons'].includes(normalized)) {
    return 'tsp'
  }

  if (['gram', 'grams'].includes(normalized)) {
    return 'g'
  }

  if (['ounce', 'ounces'].includes(normalized)) {
    return 'oz'
  }

  if (['clove', 'cloves'].includes(normalized)) {
    return 'piece'
  }

  if (['slice', 'slices'].includes(normalized)) {
    return 'piece'
  }

  return normalized
}

function convertWeightToHundredGrams(amount: number, unit: string): number {
  switch (unit) {
    case 'g':
      return amount / 100
    case 'kg':
      return (amount * 1000) / 100
    case 'oz':
      return (amount * 28.3495) / 100
    case 'lb':
    case 'lbs':
      return (amount * 453.592) / 100
    default:
      return 1
  }
}

function convertLiquidToHundredMilliliters(amount: number, unit: string): number {
  switch (unit) {
    case 'ml':
      return amount / 100
    case 'l':
      return (amount * 1000) / 100
    case 'cup':
    case 'cups':
      return (amount * 240) / 100
    case 'tbsp':
      return (amount * 15) / 100
    case 'tsp':
      return (amount * 5) / 100
    default:
      return 1
  }
}

function getMultiplier(
  amount: number,
  unit: string | null,
  basis: NutritionBasis
): number {
  const normalizedUnit = normalizeUnitAlias(unit)

  if (basis === 'piece') {
    return amount
  }

  if (basis === '100g') {
    if (!normalizedUnit) {
      return 1
    }

    return convertWeightToHundredGrams(amount, normalizedUnit)
  }

  if (basis === '100ml') {
    if (!normalizedUnit) {
      return 1
    }

    return convertLiquidToHundredMilliliters(amount, normalizedUnit)
  }

  if (basis === 'cup') {
    if (!normalizedUnit || ['cup', 'cups'].includes(normalizedUnit)) {
      return amount
    }

    return 1
  }

  if (basis === 'tbsp') {
    if (!normalizedUnit || normalizedUnit === 'tbsp') {
      return amount
    }

    if (normalizedUnit === 'tsp') {
      return amount / 3
    }

    return 1
  }

  if (basis === 'tsp') {
    if (!normalizedUnit || normalizedUnit === 'tsp') {
      return amount
    }

    if (normalizedUnit === 'tbsp') {
      return amount * 3
    }

    return 1
  }

  return 1
}

function calculateIngredientNutritionInternal(ingredient: string): {
  applied: NutritionTotals | null
  debug: ParsedIngredientDebug
} {
  const parsed = extractAmountAndUnit(ingredient)
  const match = findIngredientMatch(parsed.name)

  if (!match.value) {
    return {
      applied: null,
      debug: {
        original: ingredient,
        normalizedName: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
        matchedKey: null,
        basis: null,
        multiplier: 0,
        applied: null,
      },
    }
  }

  const multiplier = getMultiplier(parsed.amount, parsed.unit, match.value.basis)
  const applied = scaleTotals(match.value, multiplier)

  return {
    applied,
    debug: {
      original: ingredient,
      normalizedName: parsed.name,
      amount: parsed.amount,
      unit: parsed.unit,
      matchedKey: match.key,
      basis: match.value.basis,
      multiplier,
      applied: {
        calories: roundToOneDecimal(applied.calories),
        protein: roundToOneDecimal(applied.protein),
        carbs: roundToOneDecimal(applied.carbs),
        fat: roundToOneDecimal(applied.fat),
      },
    },
  }
}

export function debugParseIngredients(
  ingredients: string[]
): ParsedIngredientDebug[] {
  return ingredients.map((ingredient) => {
    const result = calculateIngredientNutritionInternal(ingredient)
    return result.debug
  })
}

export async function calculateNutrition(
  ingredients: string[]
): Promise<NutritionTotals> {
  const totals = ingredients.reduce<NutritionTotals>((current, ingredient) => {
    const result = calculateIngredientNutritionInternal(ingredient)

    if (!result.applied) {
      return current
    }

    return addTotals(current, result.applied)
  }, emptyTotals())

  return {
    calories: roundToOneDecimal(totals.calories),
    protein: roundToOneDecimal(totals.protein),
    carbs: roundToOneDecimal(totals.carbs),
    fat: roundToOneDecimal(totals.fat),
  }
}