import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
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

type RecipeFormProps = {
  initialRecipe: Recipe | null
  categoryOptions?: Record<CategoryGroupKey, CategoryOption[]>
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
  }
}

function RecipeForm({
  initialRecipe,
  categoryOptions,
  onSaveRecipe,
  onCancel,
}: RecipeFormProps) {
  const [formState, setFormState] = useState<RecipeFormState>(() =>
    getInitialFormState(initialRecipe)
  )

  const [errorMessage, setErrorMessage] = useState('')
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

  function updateField<K extends keyof RecipeFormState>(
    field: K,
    value: RecipeFormState[K]
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
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
      setErrorMessage('Image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Please upload a JPEG, PNG, WebP, or GIF image.')
      event.target.value = ''
      return
    }

    updateField('imageFile', file)
    setErrorMessage('')

    setImagePreviewUrl((current) => {
      if (current.startsWith('blob:')) {
        URL.revokeObjectURL(current)
      }
      return URL.createObjectURL(file)
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !formState.title.trim() ||
      !formState.description.trim() ||
      !formState.ingredients.trim() ||
      !formState.instructions.trim()
    ) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    const normalizedCategories = dedupeCategoryNames(formState.categories)
    if (normalizedCategories.length === 0) {
      setErrorMessage('Please choose at least one category.')
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
      calories: initialRecipe?.calories ?? 0,
      protein: initialRecipe?.protein ?? 0,
      carbs: initialRecipe?.carbs ?? 0,
      fat: initialRecipe?.fat ?? 0,
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

    setErrorMessage('')
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
  }

  return (
    <section className="recipe-form-section">
      <h2 className="recipe-form__title">
        {initialRecipe ? 'Edit Recipe' : 'Create Recipe'}
      </h2>

      {errorMessage ? <p className="recipe-form__error">{errorMessage}</p> : null}

      <form className="recipe-form" onSubmit={handleSubmit}>
        <div className="recipe-form__group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={formState.title}
            onChange={(event) => updateField('title', event.target.value)}
          />
        </div>

        <div className="recipe-form__group">
          <label htmlFor="imageFile">Recipe Image</label>
          <input
            id="imageFile"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          {imagePreviewUrl ? (
            <img
              className="recipe-form__image-preview"
              src={imagePreviewUrl}
              alt="Recipe preview"
            />
          ) : (
            <p>You can save the recipe without an image.</p>
          )}
        </div>

        <div className="recipe-form__group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formState.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>

        <div className="recipe-form__group">
          <label htmlFor="categorySearch">Categories</label>
          <input
            id="categorySearch"
            type="text"
            value={formState.categorySearch}
            onChange={(event) => updateField('categorySearch', event.target.value)}
            placeholder="Search categories..."
          />

          <div className="recipe-form__selected-categories">
            {formState.categories.map((categoryName) => (
              <button
                key={categoryName}
                type="button"
                className="recipe-form__category-chip recipe-form__category-chip--active"
                onClick={() => handleToggleCategory(categoryName)}
              >
                <span>{categoryName}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>

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
          <textarea
            id="ingredients"
            value={formState.ingredients}
            onChange={(event) => updateField('ingredients', event.target.value)}
            placeholder={`Example:
200g chicken breast
1 cup rice
1 tbsp olive oil`}
          />
        </div>

        <div className="recipe-form__group recipe-form__checkbox-group">
          <label htmlFor="isPublic">
            <input
              id="isPublic"
              type="checkbox"
              checked={formState.isPublic}
              onChange={(event) => updateField('isPublic', event.target.checked)}
            />
            Share this recipe publicly
          </label>
        </div>

        <div className="recipe-form__group">
          <label htmlFor="instructions">Instructions</label>
          <textarea
            id="instructions"
            value={formState.instructions}
            onChange={(event) => updateField('instructions', event.target.value)}
          />
        </div>

        <div className="recipe-form__actions">
          <button type="submit">
            {initialRecipe ? 'Update Recipe' : 'Save Recipe'}
          </button>

          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default RecipeForm