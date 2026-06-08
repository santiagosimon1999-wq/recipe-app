import type { ParsedIngredientDebug } from '../lib/nutritionService'
import type { NutritionTotals } from '../lib/nutritionIngredients'

export const RECIPE_FORM_HINTS = {
  ingredients:
    'Add one ingredient per line, like: 2 eggs, 1 cup rice, 1 tbsp olive oil.',
  instructions:
    'Write one step per line for easier reading. Each line becomes its own step in the recipe view.',
  nutritionDisclaimer:
    'Nutrition values are estimates. Review and edit them before saving.',
  nutritionEstimateError:
    'Nutrition estimate could not be completed. You can still save the recipe and adjust the nutrition details manually.',
} as const

export type RecipeFormFieldKey =
  | 'title'
  | 'description'
  | 'ingredients'
  | 'instructions'
  | 'categories'

export type RecipeFormFieldErrors = Partial<Record<RecipeFormFieldKey, string>>

export type NutritionEstimateFeedback = {
  kind: 'success' | 'warning' | 'error'
  message: string
}

export function validateRecipeFormFields(input: {
  title: string
  description: string
  ingredients: string
  instructions: string
  categories: string[]
}): RecipeFormFieldErrors {
  const errors: RecipeFormFieldErrors = {}

  if (!input.title.trim()) {
    errors.title = 'Add a recipe title.'
  }

  if (!input.description.trim()) {
    errors.description = 'Add a short description.'
  }

  if (!input.ingredients.trim()) {
    errors.ingredients = 'Add at least one ingredient (one per line).'
  }

  if (!input.instructions.trim()) {
    errors.instructions = 'Add cooking instructions (one step per line).'
  }

  if (input.categories.length === 0) {
    errors.categories = 'Choose at least one category.'
  }

  return errors
}

export function getNutritionEstimateFeedback(
  nutrition: NutritionTotals,
  parsed: ParsedIngredientDebug[]
): NutritionEstimateFeedback | null {
  const matchedCount = parsed.filter((row) => row.applied !== null).length
  const unmatchedCount = parsed.filter(
    (row) => row.skippedReason === 'unmatched'
  ).length

  const hasMacroValues =
    nutrition.calories > 0 ||
    nutrition.protein > 0 ||
    nutrition.carbs > 0 ||
    nutrition.fat > 0

  if (matchedCount === 0) {
    return {
      kind: 'error',
      message: RECIPE_FORM_HINTS.nutritionEstimateError,
    }
  }

  if (!hasMacroValues) {
    return {
      kind: 'error',
      message: RECIPE_FORM_HINTS.nutritionEstimateError,
    }
  }

  if (unmatchedCount > 0) {
    return {
      kind: 'warning',
      message: `Estimated from ${matchedCount} ingredient${matchedCount === 1 ? '' : 's'}. ${unmatchedCount} line${unmatchedCount === 1 ? '' : 's'} could not be matched — review and edit the nutrition fields manually.`,
    }
  }

  return {
    kind: 'success',
    message: RECIPE_FORM_HINTS.nutritionDisclaimer,
  }
}

export function getSubmitButtonLabel(
  isEditMode: boolean,
  isSaving: boolean
): string {
  if (isSaving) {
    return isEditMode ? 'Updating…' : 'Saving…'
  }

  return isEditMode ? 'Update Recipe' : 'Save Recipe'
}
