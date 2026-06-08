import type { Recipe } from '../types/Recipe'
import type { CategoryGroupKey, CategoryTag } from '../types/Category'

export type CategoryOption = {
  name: string
  slug: string
  icon: string
  groupKey: CategoryGroupKey
  groupLabel: string
}

export const CATEGORY_GROUP_LABELS: Record<CategoryGroupKey, string> = {
  meal_type: 'Meal Type',
  cuisine: 'Cuisine',
  diet: 'Diet',
  cooking_method: 'Cooking Method',
}

export const CATEGORY_REGISTRY: CategoryOption[] = [
  { name: 'Breakfast', slug: 'breakfast', icon: '☀️', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Lunch', slug: 'lunch', icon: '🥪', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Dinner', slug: 'dinner', icon: '🍽️', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Appetizer', slug: 'appetizer', icon: '✨', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Side Dish', slug: 'side-dish', icon: '🥗', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Soup', slug: 'soup', icon: '🍲', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Salad', slug: 'salad', icon: '🥬', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Snack', slug: 'snack', icon: '🍪', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Dessert', slug: 'dessert', icon: '🍰', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Beverage', slug: 'beverage', icon: '🥤', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },
  { name: 'Other', slug: 'other', icon: '🧩', groupKey: 'meal_type', groupLabel: CATEGORY_GROUP_LABELS.meal_type },

  { name: 'American', slug: 'american', icon: '🇺🇸', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Italian', slug: 'italian', icon: '🍝', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Mexican', slug: 'mexican', icon: '🌶️', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'South American', slug: 'south-american', icon: '⛰️', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Caribbean', slug: 'caribbean', icon: '🌴', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Spanish', slug: 'spanish', icon: '🥘', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'French', slug: 'french', icon: '🥐', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'German', slug: 'german', icon: '🥨', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Mediterranean', slug: 'mediterranean', icon: '🫒', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Middle Eastern', slug: 'middle-eastern', icon: '🧆', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Indian', slug: 'indian', icon: '🍛', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Chinese', slug: 'chinese', icon: '🥡', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Japanese', slug: 'japanese', icon: '🍣', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Korean', slug: 'korean', icon: '🥢', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Thai', slug: 'thai', icon: '🍜', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },
  { name: 'Vietnamese', slug: 'vietnamese', icon: '🍜', groupKey: 'cuisine', groupLabel: CATEGORY_GROUP_LABELS.cuisine },

  { name: 'High Protein', slug: 'high-protein', icon: '💪', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },
  { name: 'Low Carb', slug: 'low-carb', icon: '🌾', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },
  { name: 'Keto', slug: 'keto', icon: '🥚', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },
  { name: 'Vegetarian', slug: 'vegetarian', icon: '🥕', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },
  { name: 'Vegan', slug: 'vegan', icon: '🌱', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },
  { name: 'Gluten Free', slug: 'gluten-free', icon: '🚫🌾', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },
  { name: 'Dairy Free', slug: 'dairy-free', icon: '🥛', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },
  { name: 'Healthy', slug: 'healthy', icon: '❤️', groupKey: 'diet', groupLabel: CATEGORY_GROUP_LABELS.diet },

  { name: 'Grilled', slug: 'grilled', icon: '🔥', groupKey: 'cooking_method', groupLabel: CATEGORY_GROUP_LABELS.cooking_method },
  { name: 'Baked', slug: 'baked', icon: '🍞', groupKey: 'cooking_method', groupLabel: CATEGORY_GROUP_LABELS.cooking_method },
  { name: 'Fried', slug: 'fried', icon: '🍳', groupKey: 'cooking_method', groupLabel: CATEGORY_GROUP_LABELS.cooking_method },
  { name: 'Slow Cooker', slug: 'slow-cooker', icon: '🕒', groupKey: 'cooking_method', groupLabel: CATEGORY_GROUP_LABELS.cooking_method },
  { name: 'Air Fryer', slug: 'air-fryer', icon: '💨', groupKey: 'cooking_method', groupLabel: CATEGORY_GROUP_LABELS.cooking_method },
  { name: 'BBQ', slug: 'bbq', icon: '🔥', groupKey: 'cooking_method', groupLabel: CATEGORY_GROUP_LABELS.cooking_method },
]

export const FALLBACK_PRIMARY_CATEGORY = 'Dinner'
export const LEGACY_OTHER_CATEGORY = 'Other'

const FILTER_GROUPS: CategoryGroupKey[] = ['meal_type', 'cuisine', 'diet']

export const RECIPE_CATEGORIES = CATEGORY_REGISTRY.map((item) => item.name) as string[]
export const RECIPE_FILTER_CATEGORIES = [
  'All',
  ...CATEGORY_REGISTRY.filter((item) => FILTER_GROUPS.includes(item.groupKey)).map((item) => item.name),
] as string[]

const legacyCategoryMap: Record<string, string[]> = {
  mediterranean: ['Mediterranean'],
  asian: ['Chinese'],
  mexican: ['Mexican'],
  italian: ['Italian'],
  indian: ['Indian'],
  vegan: ['Vegan'],
  vegetarian: ['Vegetarian'],
  desserts: ['Dessert'],
  dessert: ['Dessert'],
  'fast food': ['Snack'],
  'party food': ['Appetizer'],
  'kids food': ['Snack'],
  'soups and stews': ['Soup'],
  salads: ['Salad'],
  'main courses': ['Dinner'],
  appetizers: ['Appetizer'],
  international: ['Other'],
  breakfast: ['Breakfast'],
  grilled: ['Grilled'],
  'low carb': ['Low Carb'],
  'high protein': ['High Protein'],
  other: ['Other'],
}

export function normalizeCategoryName(value: string): string {
  return value.trim().toLowerCase()
}

export function getCategoryOption(name: string): CategoryOption | undefined {
  const normalized = normalizeCategoryName(name)
  return CATEGORY_REGISTRY.find((item) => normalizeCategoryName(item.name) === normalized)
}

export function toCategoryTag(name: string): CategoryTag | null {
  const option = getCategoryOption(name)
  if (!option) return null
  return {
    name: option.name,
    slug: option.slug,
    icon: option.icon,
    groupKey: option.groupKey,
    groupLabel: option.groupLabel,
  }
}

export function resolveLegacyCategoryNames(legacyCategory: string | null | undefined): string[] {
  const normalized = normalizeCategoryName(legacyCategory ?? '')
  if (!normalized) return [LEGACY_OTHER_CATEGORY]

  if (legacyCategoryMap[normalized]) {
    return legacyCategoryMap[normalized]
  }

  const direct = CATEGORY_REGISTRY.find((item) => normalizeCategoryName(item.name) === normalized)
  return direct ? [direct.name] : [LEGACY_OTHER_CATEGORY]
}

export function dedupeCategoryNames(categories: string[]): string[] {
  const deduped = new Set<string>()

  for (const value of categories) {
    const option = getCategoryOption(value)
    if (!option) continue
    deduped.add(option.name)
  }

  return [...deduped]
}

export function getPrimaryCategory(categories: string[]): string {
  const mealCategory = categories.find((name) => getCategoryOption(name)?.groupKey === 'meal_type')
  return mealCategory ?? categories[0] ?? FALLBACK_PRIMARY_CATEGORY
}

export function getRecipeCategoryNames(recipe: Recipe): string[] {
  if (recipe.categories && recipe.categories.length > 0) {
    return dedupeCategoryNames(recipe.categories)
  }

  return dedupeCategoryNames(resolveLegacyCategoryNames(recipe.category))
}

export function toggleSelectedCategories(
  current: string[],
  category: string,
): string[] {
  if (category === 'All') {
    return []
  }

  const option = getCategoryOption(category)
  if (!option) {
    return current
  }

  if (current.includes(option.name)) {
    return current.filter((name) => name !== option.name)
  }

  const withoutSameGroup = current.filter((name) => {
    const existing = getCategoryOption(name)
    return !existing || existing.groupKey !== option.groupKey
  })

  return [...withoutSameGroup, option.name]
}

export function recipeMatchesSelectedCategories(
  recipe: Recipe,
  selectedCategories: string[],
): boolean {
  if (selectedCategories.length === 0) return true

  const recipeCategories = getRecipeCategoryNames(recipe)
  return selectedCategories.every((category) =>
    recipeCategories.includes(category),
  )
}

export function recipeMatchesSelectedCategory(recipe: Recipe, selectedCategory: string): boolean {
  if (selectedCategory === 'All') return true
  return recipeMatchesSelectedCategories(recipe, [selectedCategory])
}

export function recipeCategorySearchText(recipe: Recipe): string {
  return getRecipeCategoryNames(recipe).join(' ').toLowerCase()
}

export function groupCategoryOptions(options: CategoryOption[]): Record<CategoryGroupKey, CategoryOption[]> {
  return options.reduce<Record<CategoryGroupKey, CategoryOption[]>>(
    (acc, option) => {
      acc[option.groupKey].push(option)
      return acc
    },
    {
      meal_type: [],
      cuisine: [],
      diet: [],
      cooking_method: [],
    }
  )
}
