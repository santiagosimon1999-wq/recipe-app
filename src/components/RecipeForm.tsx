import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { Sparkles } from 'lucide-react'
import {
  calculateNutrition,
  debugParseIngredients,
  estimateCookingTime,
  estimateServings,
} from '../lib/nutritionService'
import type { CategoryGroupKey } from '../types/Category'
import type { Recipe } from '../types/Recipe'
import {
  CATEGORY_REGISTRY,
  dedupeCategoryNames,
  getPrimaryCategory,
  getRecipeCategoryNames,
  groupCategoryOptions,
  type CategoryOption,
} from '../utils/categories'
import {
  getNutritionEstimateFeedback,
  getSubmitButtonLabel,
  RECIPE_FORM_HINTS,
  validateRecipeFormFields,
  type NutritionEstimateFeedback,
  type RecipeFormFieldErrors,
  type RecipeFormFieldKey,
} from './recipeFormHelpers'

type RecipeFormProps = {
  initialRecipe: Recipe | null
  categoryOptions?: Record<CategoryGroupKey, CategoryOption[]>
  isSaving?: boolean
  onSaveRecipe: (recipe: Recipe) => void
  onCancel: () => void
}

type RecipeFormState = {
  title: string
  image: string
  imageFile: File | null
  description: string
  category: string
  categories: string[]
  categorySearch: string
  ingredients: string
  instructions: string
  isPublic: boolean
  calories: string
  protein: string
  carbs: string
  fat: string
  cookingTime: string
  servings: string
}

function getInitialFormState(initialRecipe: Recipe | null): RecipeFormState {
  if (!initialRecipe) {
    return {
      title: '',
      image: '',
      imageFile: null,
      description: '',
      category: getPrimaryCategory(['Dinner']),
      categories: ['Dinner'],
      categorySearch: '',
      ingredients: '',
      instructions: '',
      isPublic: true,
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      cookingTime: '',
      servings: '',
    }
  }

  return {
    title: initialRecipe.title,
    image: initialRecipe.image,
    imageFile: null,
    description: initialRecipe.description,
    category: getPrimaryCategory(getRecipeCategoryNames(initialRecipe)),
    categories: getRecipeCategoryNames(initialRecipe),
    categorySearch: '',
    ingredients: initialRecipe.ingredients.join('\n'),
    instructions: initialRecipe.instructions,
    isPublic: initialRecipe.isPublic ?? true,
    calories: initialRecipe.calories > 0 ? String(initialRecipe.calories) : '',
    protein: initialRecipe.protein > 0 ? String(initialRecipe.protein) : '',
    carbs: initialRecipe.carbs > 0 ? String(initialRecipe.carbs) : '',
    fat: initialRecipe.fat > 0 ? String(initialRecipe.fat) : '',
    cookingTime:
      initialRecipe.cookingTime != null && initialRecipe.cookingTime > 0
        ? String(initialRecipe.cookingTime)
        : '',
    servings:
      initialRecipe.servings != null && initialRecipe.servings > 0
        ? String(initialRecipe.servings)
        : '',
  }
}

function parsePositiveInt(value: string): number {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function fieldErrorId(field: RecipeFormFieldKey): string {
  return `recipe-form-error-${field}`
}

function describedBy(...ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}

function RecipeForm({
  initialRecipe,
  categoryOptions,
  isSaving = false,
  onSaveRecipe,
  onCancel,
}: RecipeFormProps) {
  const [formState, setFormState] = useState<RecipeFormState>(() =>
    getInitialFormState(initialRecipe)
  )

  const [formErrorMessage, setFormErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<RecipeFormFieldErrors>({})
  const [estimating, setEstimating] = useState(false)
  const [nutritionFeedback, setNutritionFeedback] =
    useState<NutritionEstimateFeedback | null>(null)

  const nutritionFeedbackId = useId()

  const groupedCategoryOptions =
    categoryOptions && Object.values(categoryOptions).some((group) => group.length > 0)
      ? categoryOptions
      : groupCategoryOptions(CATEGORY_REGISTRY)

  const categorySearchLower = formState.categorySearch.trim().toLowerCase()
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initialRecipe?.image ?? ''
  )

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  function clearFieldError(field: RecipeFormFieldKey) {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function updateField<K extends keyof RecipeFormState>(
    field: K,
    value: RecipeFormState[K]
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))

    if (
      field === 'title' ||
      field === 'description' ||
      field === 'ingredients' ||
      field === 'instructions'
    ) {
      clearFieldError(field)
    }

    if (field === 'ingredients' || field === 'instructions') {
      setNutritionFeedback(null)
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      updateField('imageFile', null)
      setImagePreviewUrl((current) => {
        if (current.startsWith('blob:')) {
          URL.revokeObjectURL(current)
        }
        return initialRecipe?.image ?? ''
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormErrorMessage('Image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setFormErrorMessage('Please upload a JPEG, PNG, WebP, or GIF image.')
      event.target.value = ''
      return
    }

    updateField('imageFile', file)
    setFormErrorMessage('')

    setImagePreviewUrl((current) => {
      if (current.startsWith('blob:')) {
        URL.revokeObjectURL(current)
      }
      return URL.createObjectURL(file)
    })
  }

  async function handleEstimate() {
    const ingredientLines = formState.ingredients
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')

    if (ingredientLines.length === 0) {
      setFieldErrors((current) => ({
        ...current,
        ingredients: 'Add at least one ingredient before estimating.',
      }))
      return
    }

    setEstimating(true)
    setFormErrorMessage('')
    setNutritionFeedback(null)

    try {
      const nutrition = await calculateNutrition(ingredientLines)
      const parsed = debugParseIngredients(ingredientLines)
      const feedback = getNutritionEstimateFeedback(nutrition, parsed)
      setNutritionFeedback(feedback)

      if (feedback?.kind === 'error') {
        return
      }

      const cookingTime = estimateCookingTime({
        title: formState.title,
        ingredients: ingredientLines,
        instructions: formState.instructions,
      })
      const servings = estimateServings(
        {
          title: formState.title,
          ingredients: ingredientLines,
          instructions: formState.instructions,
        },
        nutrition.calories
      )

      setFormState((current) => ({
        ...current,
        calories:
          nutrition.calories > 0
            ? String(Math.round(nutrition.calories))
            : current.calories,
        protein:
          nutrition.protein > 0
            ? String(Math.round(nutrition.protein))
            : current.protein,
        carbs:
          nutrition.carbs > 0 ? String(Math.round(nutrition.carbs)) : current.carbs,
        fat: nutrition.fat > 0 ? String(Math.round(nutrition.fat)) : current.fat,
        cookingTime: String(cookingTime),
        servings: String(servings),
      }))
    } catch (error) {
      console.error('Nutrition estimate failed:', error)
      setNutritionFeedback({
        kind: 'error',
        message: RECIPE_FORM_HINTS.nutritionEstimateError,
      })
    } finally {
      setEstimating(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) return

    const normalizedCategories = dedupeCategoryNames(formState.categories)
    const validationErrors = validateRecipeFormFields({
      title: formState.title,
      description: formState.description,
      ingredients: formState.ingredients,
      instructions: formState.instructions,
      categories: normalizedCategories,
    })

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setFormErrorMessage('Please fix the highlighted fields before saving.')
      return
    }

    const recipeToSave: Recipe = {
      id: initialRecipe?.id ?? 0,
      title: formState.title.trim(),
      image: formState.image.trim(),
      imageFile: formState.imageFile,
      description: formState.description.trim(),
      category: getPrimaryCategory(normalizedCategories),
      categories: normalizedCategories,
      calories: parsePositiveInt(formState.calories),
      protein: parsePositiveInt(formState.protein),
      carbs: parsePositiveInt(formState.carbs),
      fat: parsePositiveInt(formState.fat),
      cookingTime: parsePositiveInt(formState.cookingTime) || null,
      servings: parsePositiveInt(formState.servings) || null,
      ingredients: formState.ingredients
        .split('\n')
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient !== ''),
      instructions: formState.instructions.trim(),
      source: initialRecipe?.source ?? 'user',
      isPublic: formState.isPublic,
      likeCount: initialRecipe?.likeCount ?? 0,
      liked: initialRecipe?.liked ?? false,
    }

    setFormErrorMessage('')
    setFieldErrors({})
    onSaveRecipe(recipeToSave)
  }

  function handleToggleCategory(categoryName: string) {
    setFormState((current) => {
      const alreadySelected = current.categories.includes(categoryName)
      const nextCategories = alreadySelected
        ? current.categories.filter((item) => item !== categoryName)
        : dedupeCategoryNames([...current.categories, categoryName])

      return {
        ...current,
        categories: nextCategories,
        category: getPrimaryCategory(nextCategories),
      }
    })
    clearFieldError('categories')
  }

  const submitLabel = getSubmitButtonLabel(Boolean(initialRecipe), isSaving)

  return (
    <section className="recipe-form-section">
      <h2 className="recipe-form__title">
        {initialRecipe ? 'Edit Recipe' : 'Create Recipe'}
      </h2>

      {formErrorMessage ? (
        <p className="recipe-form__error" role="alert">
          {formErrorMessage}
        </p>
      ) : null}

      <form className="recipe-form" onSubmit={handleSubmit} noValidate>
        <div className="recipe-form__group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={formState.title}
            onChange={(event) => updateField('title', event.target.value)}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={
              fieldErrors.title ? fieldErrorId('title') : undefined
            }
            disabled={isSaving}
          />
          {fieldErrors.title ? (
            <p
              id={fieldErrorId('title')}
              className="recipe-form__field-error"
              role="alert"
            >
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div className="recipe-form__group">
          <label htmlFor="imageFile">Recipe Image</label>
          <input
            id="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            disabled={isSaving}
          />
          <p id="imageFile-hint" className="recipe-form__hint">
            Optional. JPEG, PNG, WebP, or GIF up to 5 MB.
          </p>

          {imagePreviewUrl ? (
            <img
              className="recipe-form__image-preview"
              src={imagePreviewUrl}
              alt="Recipe preview"
            />
          ) : (
            <p className="recipe-form__hint">You can save the recipe without an image.</p>
          )}
        </div>

        <div className="recipe-form__group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formState.description}
            onChange={(event) => updateField('description', event.target.value)}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={
              fieldErrors.description ? fieldErrorId('description') : undefined
            }
            disabled={isSaving}
          />
          {fieldErrors.description ? (
            <p
              id={fieldErrorId('description')}
              className="recipe-form__field-error"
              role="alert"
            >
              {fieldErrors.description}
            </p>
          ) : null}
        </div>

        <div className="recipe-form__group">
          <label htmlFor="categorySearch">Categories</label>
          <input
            id="categorySearch"
            type="text"
            value={formState.categorySearch}
            onChange={(event) => updateField('categorySearch', event.target.value)}
            placeholder="Search categories..."
            disabled={isSaving}
          />

          <div className="recipe-form__selected-categories">
            {formState.categories.map((categoryName) => (
              <button
                key={categoryName}
                type="button"
                className="recipe-form__category-chip recipe-form__category-chip--active"
                onClick={() => handleToggleCategory(categoryName)}
                disabled={isSaving}
                aria-label={`Remove ${categoryName} category`}
              >
                <span>{categoryName}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>

          {fieldErrors.categories ? (
            <p
              id={fieldErrorId('categories')}
              className="recipe-form__field-error"
              role="alert"
            >
              {fieldErrors.categories}
            </p>
          ) : null}

          <div className="recipe-form__category-groups">
            {(Object.entries(groupedCategoryOptions) as Array<
              [CategoryGroupKey, CategoryOption[]]
            >).map(([groupKey, options]) => {
              const filteredOptions = options.filter((option) =>
                option.name.toLowerCase().includes(categorySearchLower)
              )
              if (filteredOptions.length === 0) return null

              return (
                <div key={groupKey} className="recipe-form__category-group">
                  <p className="recipe-form__category-group-label">
                    {filteredOptions[0]?.groupLabel}
                  </p>
                  <div className="recipe-form__category-options">
                    {filteredOptions.map((option) => {
                      const selected = formState.categories.includes(option.name)
                      return (
                        <button
                          key={option.slug}
                          type="button"
                          className={
                            selected
                              ? 'recipe-form__category-chip recipe-form__category-chip--active'
                              : 'recipe-form__category-chip'
                          }
                          onClick={() => handleToggleCategory(option.name)}
                          disabled={isSaving}
                          aria-pressed={selected}
                        >
                          {option.icon ? <span aria-hidden="true">{option.icon}</span> : null}
                          <span>{option.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="recipe-form__group">
          <label htmlFor="ingredients">Ingredients — one per line</label>
          <p id="ingredients-hint" className="recipe-form__hint">
            {RECIPE_FORM_HINTS.ingredients}
          </p>
          <textarea
            id="ingredients"
            value={formState.ingredients}
            onChange={(event) => updateField('ingredients', event.target.value)}
            aria-describedby={describedBy(
              'ingredients-hint',
              fieldErrors.ingredients ? fieldErrorId('ingredients') : undefined
            )}
            aria-invalid={Boolean(fieldErrors.ingredients)}
            placeholder={`Example:
2 eggs
1 cup rice
1 tbsp olive oil`}
            disabled={isSaving}
          />
          {fieldErrors.ingredients ? (
            <p
              id={fieldErrorId('ingredients')}
              className="recipe-form__field-error"
              role="alert"
            >
              {fieldErrors.ingredients}
            </p>
          ) : null}
        </div>

        <div className="recipe-form__group">
          <label htmlFor="instructions">Instructions</label>
          <p id="instructions-hint" className="recipe-form__hint">
            {RECIPE_FORM_HINTS.instructions}
          </p>
          <textarea
            id="instructions"
            value={formState.instructions}
            onChange={(event) => updateField('instructions', event.target.value)}
            aria-describedby={describedBy(
              'instructions-hint',
              fieldErrors.instructions ? fieldErrorId('instructions') : undefined
            )}
            aria-invalid={Boolean(fieldErrors.instructions)}
            placeholder={`Example:
Preheat the oven to 400°F.
Toss vegetables with olive oil and roast for 20 minutes.
Serve warm.`}
            disabled={isSaving}
          />
          {fieldErrors.instructions ? (
            <p
              id={fieldErrorId('instructions')}
              className="recipe-form__field-error"
              role="alert"
            >
              {fieldErrors.instructions}
            </p>
          ) : null}
        </div>

        <div className="recipe-form__nutrition-section">
          <div className="recipe-form__nutrition-header">
            <p className="recipe-form__nutrition-label">Nutrition &amp; details</p>
            <button
              type="button"
              className="recipe-form__estimate-button"
              onClick={() => void handleEstimate()}
              disabled={estimating || isSaving}
              aria-busy={estimating}
            >
              <Sparkles size={15} aria-hidden="true" />
              {estimating ? 'Estimating…' : 'Estimate with Savora'}
            </button>
          </div>

          {nutritionFeedback ? (
            <p
              id={nutritionFeedbackId}
              className={
                nutritionFeedback.kind === 'error'
                  ? 'recipe-form__nutrition-feedback recipe-form__nutrition-feedback--error'
                  : nutritionFeedback.kind === 'warning'
                    ? 'recipe-form__nutrition-feedback recipe-form__nutrition-feedback--warning'
                    : 'recipe-form__nutrition-feedback recipe-form__nutrition-feedback--success'
              }
              role="status"
              aria-live="polite"
            >
              {nutritionFeedback.message}
            </p>
          ) : (
            <p className="recipe-form__estimate-note">
              {RECIPE_FORM_HINTS.nutritionDisclaimer}
            </p>
          )}

          <div className="recipe-form__nutrition-grid">
            <div className="recipe-form__group recipe-form__group--inline">
              <label htmlFor="calories">Calories</label>
              <input
                id="calories"
                type="number"
                min="0"
                step="1"
                value={formState.calories}
                onChange={(event) => updateField('calories', event.target.value)}
                placeholder="e.g. 450"
                disabled={isSaving}
              />
            </div>

            <div className="recipe-form__group recipe-form__group--inline">
              <label htmlFor="protein">Protein (g)</label>
              <input
                id="protein"
                type="number"
                min="0"
                step="1"
                value={formState.protein}
                onChange={(event) => updateField('protein', event.target.value)}
                placeholder="e.g. 30"
                disabled={isSaving}
              />
            </div>

            <div className="recipe-form__group recipe-form__group--inline">
              <label htmlFor="carbs">Carbs (g)</label>
              <input
                id="carbs"
                type="number"
                min="0"
                step="1"
                value={formState.carbs}
                onChange={(event) => updateField('carbs', event.target.value)}
                placeholder="e.g. 45"
                disabled={isSaving}
              />
            </div>

            <div className="recipe-form__group recipe-form__group--inline">
              <label htmlFor="fat">Fat (g)</label>
              <input
                id="fat"
                type="number"
                min="0"
                step="1"
                value={formState.fat}
                onChange={(event) => updateField('fat', event.target.value)}
                placeholder="e.g. 12"
                disabled={isSaving}
              />
            </div>

            <div className="recipe-form__group recipe-form__group--inline">
              <label htmlFor="cookingTime">Cook time (min)</label>
              <input
                id="cookingTime"
                type="number"
                min="1"
                step="1"
                value={formState.cookingTime}
                onChange={(event) => updateField('cookingTime', event.target.value)}
                placeholder="e.g. 30"
                disabled={isSaving}
              />
            </div>

            <div className="recipe-form__group recipe-form__group--inline">
              <label htmlFor="servings">Servings</label>
              <input
                id="servings"
                type="number"
                min="1"
                step="1"
                value={formState.servings}
                onChange={(event) => updateField('servings', event.target.value)}
                placeholder="e.g. 4"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <div className="recipe-form__group recipe-form__checkbox-group">
          <label htmlFor="isPublic">
            <input
              id="isPublic"
              type="checkbox"
              checked={formState.isPublic}
              onChange={(event) => updateField('isPublic', event.target.checked)}
              disabled={isSaving}
            />
            Share this recipe publicly
          </label>
        </div>

        <div className="recipe-form__actions">
          <button
            type="submit"
            className="recipe-form__submit-button"
            disabled={isSaving || estimating}
            aria-busy={isSaving}
            aria-disabled={isSaving}
          >
            {submitLabel}
          </button>

          <button
            type="button"
            className="recipe-form__cancel-button"
            onClick={onCancel}
            disabled={isSaving}
            aria-disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default RecipeForm
