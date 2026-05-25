import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Recipe } from '../types/Recipe'
import { RECIPE_CATEGORIES } from '../utils/categories'

type RecipeFormProps = {
  initialRecipe: Recipe | null
  onSaveRecipe: (recipe: Recipe) => void
  onCancel: () => void
}

type RecipeFormState = {
  title: string
  image: string
  imageFile: File | null
  description: string
  category: string
  ingredients: string
  instructions: string
}

function getInitialFormState(initialRecipe: Recipe | null): RecipeFormState {
  if (!initialRecipe) {
    return {
      title: '',
      image: '',
      imageFile: null,
      description: '',
      category: RECIPE_CATEGORIES[0],
      ingredients: '',
      instructions: '',
    }
  }

  return {
    title: initialRecipe.title,
    image: initialRecipe.image,
    imageFile: null,
    description: initialRecipe.description,
    category: initialRecipe.category,
    ingredients: initialRecipe.ingredients.join('\n'),
    instructions: initialRecipe.instructions,
  }
}

function RecipeForm({ initialRecipe, onSaveRecipe, onCancel }: RecipeFormProps) {
  const [formState, setFormState] = useState<RecipeFormState>(() =>
    getInitialFormState(initialRecipe)
  )

  const [errorMessage, setErrorMessage] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initialRecipe?.image ?? ''
  )

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
      setImagePreviewUrl(initialRecipe?.image ?? '')
      return
    }

    updateField('imageFile', file)

    const previewUrl = URL.createObjectURL(file)
    setImagePreviewUrl(previewUrl)
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

    const recipeToSave: Recipe = {
      id: initialRecipe?.id ?? 0,
      title: formState.title.trim(),
      image: formState.image.trim(),
      imageFile: formState.imageFile,
      description: formState.description.trim(),
      category: formState.category,
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
    }

    setErrorMessage('')
    onSaveRecipe(recipeToSave)
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
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formState.category}
            onChange={(event) => updateField('category', event.target.value)}
          >
            {RECIPE_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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