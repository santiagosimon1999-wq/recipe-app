import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import RecipeForm from './RecipeForm'
import { RECIPE_FORM_HINTS } from './recipeFormHelpers'

describe('RecipeForm', () => {
  it('shows ingredients and instructions helper text', () => {
    const html = renderToStaticMarkup(
      <RecipeForm
        initialRecipe={null}
        onSaveRecipe={() => undefined}
        onCancel={() => undefined}
      />
    )

    expect(html).toContain(RECIPE_FORM_HINTS.ingredients)
    expect(html).toContain(RECIPE_FORM_HINTS.instructions)
    expect(html).toContain(RECIPE_FORM_HINTS.nutritionDisclaimer)
  })

  it('disables submit and shows saving label while save is in progress', () => {
    const html = renderToStaticMarkup(
      <RecipeForm
        initialRecipe={null}
        isSaving
        onSaveRecipe={() => undefined}
        onCancel={() => undefined}
      />
    )

    expect(html).toContain('Saving…')
    expect(html).toMatch(/disabled=""[^>]*>Saving…|Saving…<\/button>/)
    expect(html).toContain('aria-busy="true"')
  })

  it('shows updating label in edit mode while save is in progress', () => {
    const html = renderToStaticMarkup(
      <RecipeForm
        initialRecipe={{
          id: 12,
          title: 'Soup',
          image: '',
          description: 'Warm bowl',
          category: 'Dinner',
          categories: ['Dinner'],
          calories: 200,
          protein: 10,
          carbs: 20,
          fat: 5,
          ingredients: ['broth'],
          instructions: 'Heat\nServe',
          source: 'user',
          isPublic: true,
          likeCount: 0,
          liked: false,
        }}
        isSaving
        onSaveRecipe={() => undefined}
        onCancel={() => undefined}
      />
    )

    expect(html).toContain('Updating…')
    expect(html).toContain('Edit Recipe')
    expect(html).toContain('broth')
    expect(html).toContain('Heat')
  })
})
