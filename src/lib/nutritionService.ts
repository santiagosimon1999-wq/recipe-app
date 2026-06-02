import {
  getIngredientAliasCount,
  normalizeIngredientLookupText,
  resolveIngredientAlias,
  toSingularPhrase,
} from './ingredientAliases'
import {
  getIngredientCategoryCounts,
  getSupportedIngredientKeys as getSupportedIngredientKeysFromCatalog,
  INGREDIENT_NUTRITION,
} from './nutritionIngredients'
import type { NutritionBasis, NutritionTotals } from './nutritionIngredients'

export type { NutritionTotals }

export type ParsedIngredientDebug = {
  original: string
  normalizedName: string
  amount: number
  unit: string | null
  matchedKey: string | null
  basis: NutritionBasis | null
  multiplier: number
  applied: NutritionTotals | null
  skippedReason: 'section-header' | 'unmatched' | null
}

const SORTED_INGREDIENT_KEYS = Object.keys(INGREDIENT_NUTRITION).sort(
  (a, b) => b.length - a.length
)

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
  return normalizeIngredientLookupText(value)
}

function normalizeIngredientName(value: string): string {
  const noiseWordsPattern = [
    'of',
    'and',
    'with',
    'without',
    'fresh',
    'chopped',
    'diced',
    'sliced',
    'minced',
    'grated',
    'shredded',
    'large',
    'medium',
    'small',
    'boneless',
    'skinless',
    'ground',
    'to taste',
    'optional',
    'opcional',
    'al gusto',
    'con',
    'sin',
    'para',
    'al',
    'la',
    'el',
    'los',
    'las',
    'un',
    'una',
    'unos',
    'unas',
    'cups?',
    'tazas?',
    'tbsp',
    'tablespoons?',
    'cucharadas?',
    'tsp',
    'teaspoons?',
    'cucharaditas?',
    'grams?',
    'gramos?',
    'gramo',
    'kg',
    'kilogramos?',
    'kilogramo',
    'ml',
    'mililitros?',
    'mililitro',
    'liters?',
    'litros?',
    'litro',
    'oz',
    'ounces?',
    'onzas?',
    'lb',
    'lbs',
    'libras?',
    'libra',
  ].join('|')

  return normalizeIngredientLookupText(value)
    .replace(new RegExp(`\\b(${noiseWordsPattern})\\b`, 'g'), ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSectionHeaderLine(ingredient: string): boolean {
  const normalized = normalizeIngredientLookupText(ingredient)
  if (!normalized) return true

  const startsWithPara = /^para\b/.test(normalized)
  const hasAmount = /\d/.test(normalized)
  return startsWithPara && !hasAmount
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
    /^(?<amount>\d+\s+\d+\/\d+|\d+\/\d+|\d+(\.\d+)?)\s*(?<unit>cups?|cup|tazas?|tbsp|tablespoons?|cucharadas?|tsp|teaspoons?|cucharaditas?|grams?|gramos?|gramo|gr|g|kg|kilogramos?|kilogramo|ml|mililitros?|mililitro|l|liters?|litros?|litro|oz|ounces?|onzas?|lb|lbs|libras?|libra|cloves?|dientes?|slices?|rebanadas?)?\s+(?<name>.+)$/i

  const match = normalized.match(pattern)

  if (match?.groups) {
    const amount = parseAmount(match.groups.amount)
    const unit = match.groups.unit?.toLowerCase() ?? null
    const name = normalizeIngredientName(match.groups.name)

    if (amount !== null && name) {
      return { amount, unit, name }
    }
  }

  return {
    amount: 1,
    unit: null,
    name: normalizeIngredientName(normalized),
  }
}

function containsWholePhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text)
}

function findIngredientMatch(name: string): {
  key: string | null
  value: (typeof INGREDIENT_NUTRITION)[string] | null
} {
  const aliasMatch = resolveIngredientAlias(name)
  if (aliasMatch && INGREDIENT_NUTRITION[aliasMatch]) {
    return {
      key: aliasMatch,
      value: INGREDIENT_NUTRITION[aliasMatch],
    }
  }

  if (INGREDIENT_NUTRITION[name]) {
    return {
      key: name,
      value: INGREDIENT_NUTRITION[name],
    }
  }

  const singularName = toSingularPhrase(name)
  if (INGREDIENT_NUTRITION[singularName]) {
    return {
      key: singularName,
      value: INGREDIENT_NUTRITION[singularName],
    }
  }

  const bestMatch = SORTED_INGREDIENT_KEYS.find(
    (key) => containsWholePhrase(name, key) || containsWholePhrase(singularName, key)
  )

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
  if (['cucharada', 'cucharadas'].includes(normalized)) {
    return 'tbsp'
  }

  if (['teaspoon', 'teaspoons'].includes(normalized)) {
    return 'tsp'
  }
  if (['cucharadita', 'cucharaditas'].includes(normalized)) {
    return 'tsp'
  }

  if (['taza', 'tazas'].includes(normalized)) {
    return 'cup'
  }

  if (['gram', 'grams'].includes(normalized)) {
    return 'g'
  }
  if (['gramo', 'gramos', 'gr'].includes(normalized)) {
    return 'g'
  }

  if (['kilogramo', 'kilogramos'].includes(normalized)) {
    return 'kg'
  }

  if (['ounce', 'ounces'].includes(normalized)) {
    return 'oz'
  }
  if (['onza', 'onzas'].includes(normalized)) {
    return 'oz'
  }

  if (['libra', 'libras'].includes(normalized)) {
    return 'lb'
  }

  if (['mililitro', 'mililitros'].includes(normalized)) {
    return 'ml'
  }

  if (['litro', 'litros', 'liter', 'liters'].includes(normalized)) {
    return 'l'
  }

  if (['clove', 'cloves'].includes(normalized)) {
    return 'piece'
  }
  if (['diente', 'dientes'].includes(normalized)) {
    return 'piece'
  }

  if (['slice', 'slices'].includes(normalized)) {
    return 'piece'
  }
  if (['rebanada', 'rebanadas'].includes(normalized)) {
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
  if (isSectionHeaderLine(ingredient)) {
    return {
      applied: null,
      debug: {
        original: ingredient,
        normalizedName: '',
        amount: 0,
        unit: null,
        matchedKey: null,
        basis: null,
        multiplier: 0,
        applied: null,
        skippedReason: 'section-header',
      },
    }
  }

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
        skippedReason: 'unmatched',
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
      skippedReason: null,
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

export function getSupportedIngredientCount(): number {
  return Object.keys(INGREDIENT_NUTRITION).length
}

export function getSupportedIngredientKeys(): string[] {
  return getSupportedIngredientKeysFromCatalog()
}

export function getNutritionCoverageReport(sampleIngredients: string[] = []): {
  totalIngredients: number
  totalAliases: number
  categoryCoverage: ReturnType<typeof getIngredientCategoryCounts>
  successfulMatches: Array<{ input: string; matchedKey: string | null }>
} {
  const successfulMatches = debugParseIngredients(sampleIngredients).map((parsed) => ({
    input: parsed.original,
    matchedKey: parsed.matchedKey,
  }))

  return {
    totalIngredients: getSupportedIngredientCount(),
    totalAliases: getIngredientAliasCount(),
    categoryCoverage: getIngredientCategoryCounts(),
    successfulMatches,
  }
}

type EstimateParams = {
  title: string
  ingredients: string[]
  instructions: string
}

/**
 * Estimate cooking time in minutes from recipe text.
 * Scans instructions for explicit time mentions first.
 * Falls back to method-keyword heuristics.
 */
export function estimateCookingTime(params: EstimateParams): number {
  const instructions = params.instructions.toLowerCase()
  const allText = [params.title, ...params.ingredients, params.instructions]
    .join(' ')
    .toLowerCase()

  // Extract all explicit minute/hour mentions from instructions
  let totalMinutes = 0
  let foundExplicit = false

  const hourPattern = /(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/g
  const minPattern = /(\d+)\s*(?:minute|min)s?/g

  let match: RegExpExecArray | null
  while ((match = hourPattern.exec(instructions)) !== null) {
    totalMinutes += parseFloat(match[1]) * 60
    foundExplicit = true
  }
  while ((match = minPattern.exec(instructions)) !== null) {
    const value = parseInt(match[1], 10)
    // Ignore implausibly small values (e.g. "step 1", "2 tbsp")
    if (value >= 3 && value <= 480) {
      totalMinutes += value
      foundExplicit = true
    }
  }

  if (foundExplicit && totalMinutes >= 5) {
    return Math.min(Math.round(totalMinutes), 480)
  }

  // Method-keyword heuristics
  const slow = ['slow cooker', 'crockpot', 'braise', 'roast', 'bake', 'broil', 'stew', 'overnight', 'marinate']
  const medium = ['boil', 'steam', 'pressure cook', 'instant pot', 'poach', 'simmer']
  const fast = ['sauté', 'saute', 'stir-fry', 'stir fry', 'pan-fry', 'pan fry', 'fry', 'grill', 'sear', 'toast']

  if (slow.some((kw) => allText.includes(kw))) return 60
  if (medium.some((kw) => allText.includes(kw))) return 30
  if (fast.some((kw) => allText.includes(kw))) return 15

  // Default: 30 minutes
  return 30
}

/**
 * Estimate serving count from recipe text and calorie total.
 * Scans for "serves N" / "yields N" text first, then uses calorie-based heuristic.
 */
export function estimateServings(
  params: EstimateParams,
  totalCalories: number
): number {
  const allText = [params.title, ...params.ingredients, params.instructions]
    .join(' ')
    .toLowerCase()

  // Explicit serving patterns: "serves 4", "yield 6", "4 servings", "makes 2 portions"
  const patterns = [
    /(?:serves?|yields?|makes?)\s+(\d+)/,
    /(\d+)\s+(?:servings?|portions?|people)/,
  ]

  for (const pattern of patterns) {
    const m = allText.match(pattern)
    if (m) {
      const count = parseInt(m[1], 10)
      if (count >= 1 && count <= 24) return count
    }
  }

  // Calorie-based heuristic: assume ~500 cal per serving
  if (totalCalories > 0) {
    return Math.max(1, Math.min(Math.round(totalCalories / 500), 12))
  }

  // Ingredient-count heuristic
  const count = params.ingredients.length
  if (count <= 4) return 2
  if (count <= 8) return 4
  return 6
}

export async function calculateNutrition(
  ingredients: string[]
): Promise<NutritionTotals> {
  const totals = ingredients.reduce<NutritionTotals>((current, ingredient) => {
    const result = calculateIngredientNutritionInternal(ingredient)

    if (result.debug.skippedReason === 'section-header') {
      console.info('[nutrition] skipped section header:', {
        ingredient: result.debug.original,
      })
      return current
    }

    if (!result.applied) {
      console.warn('[nutrition] unmatched ingredient:', {
        ingredient: result.debug.original,
        normalizedName: result.debug.normalizedName,
      })
      return current
    }

    console.info('[nutrition] matched ingredient:', {
      ingredient: result.debug.original,
      normalizedName: result.debug.normalizedName,
      matchedKey: result.debug.matchedKey,
      basis: result.debug.basis,
      multiplier: result.debug.multiplier,
      applied: result.debug.applied,
    })

    return addTotals(current, result.applied)
  }, emptyTotals())

  return {
    calories: roundToOneDecimal(totals.calories),
    protein: roundToOneDecimal(totals.protein),
    carbs: roundToOneDecimal(totals.carbs),
    fat: roundToOneDecimal(totals.fat),
  }
}
