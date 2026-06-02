import { describe, expect, it } from 'vitest'
import type { RecipeRowWithAuthor } from './recipeService'
import {
  extractAuthorDisplayName,
  extractAuthorUsername,
  mapDbRowToRecipe,
  normalizeRecipeForUi,
} from './recipeMappers'

function makeRow(
  overrides: Partial<RecipeRowWithAuthor> = {}
): RecipeRowWithAuthor {
  return {
    id: 1,
    user_id: 'user-a',
    author_id: 'user-a',
    title: 'Test Recipe',
    description: 'A tasty dish',
    ingredients: ['1 egg'],
    instructions: 'Cook it',
    category: 'Breakfast',
    image_url: 'https://example.com/img.jpg',
    calories: 100,
    protein: 10,
    carbs: 5,
    fat: 3,
    is_public: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('extractAuthorUsername', () => {
  it('reads username from a single author object', () => {
    expect(
      extractAuthorUsername(
        makeRow({
          author: { username: 'chef_sam', display_name: 'Sam' },
        })
      )
    ).toBe('chef_sam')
  })

  it('reads username from an author array', () => {
    expect(
      extractAuthorUsername(
        makeRow({
          author: [{ username: 'chef_sam', display_name: 'Sam' }],
        })
      )
    ).toBe('chef_sam')
  })
})

describe('extractAuthorDisplayName', () => {
  it('prefers display_name from the join', () => {
    expect(
      extractAuthorDisplayName(
        makeRow({
          author: { username: 'chef_sam', display_name: 'Sam Cook' },
        })
      )
    ).toBe('Sam Cook')
  })
})

describe('mapDbRowToRecipe', () => {
  it('marks rows owned by the current user as source user', () => {
    const recipe = mapDbRowToRecipe(makeRow({ user_id: 'user-a' }), 'user-a')
    expect(recipe.source).toBe('user')
    expect(recipe.userId).toBe('user-a')
  })

  it('marks other users public rows as community', () => {
    const recipe = mapDbRowToRecipe(makeRow({ user_id: 'user-b' }), 'user-a')
    expect(recipe.source).toBe('community')
  })

  it('uses joined author display name with username fallback', () => {
    const withDisplay = mapDbRowToRecipe(
      makeRow({
        author: { username: 'chef_sam', display_name: 'Sam Cook' },
      })
    )
    expect(withDisplay.authorName).toBe('Sam Cook')
    expect(withDisplay.authorUsername).toBe('chef_sam')

    const usernameOnly = mapDbRowToRecipe(
      makeRow({
        author: { username: 'chef_sam', display_name: null },
      })
    )
    expect(usernameOnly.authorName).toBe('chef_sam')
  })

  it('falls back to Savora Chef when author join is missing', () => {
    const recipe = mapDbRowToRecipe(makeRow({ author: null }))
    expect(recipe.authorName).toBe('Savora Chef')
  })

  it('initializes likes as zero/false for later enrichment', () => {
    const recipe = mapDbRowToRecipe(makeRow())
    expect(recipe.likeCount).toBe(0)
    expect(recipe.liked).toBe(false)
  })

  it('maps relation category tags when present', () => {
    const recipe = mapDbRowToRecipe(
      makeRow({
        category: 'Dinner',
        category_tags: [
          {
            id: 1,
            name: 'Dinner',
            slug: 'dinner',
            icon: '🍽️',
            groupKey: 'meal_type',
            groupLabel: 'Meal Type',
          },
          {
            id: 2,
            name: 'Italian',
            slug: 'italian',
            icon: '🍝',
            groupKey: 'cuisine',
            groupLabel: 'Cuisine',
          },
        ],
      })
    )

    expect(recipe.category).toBe('Dinner')
    expect(recipe.categories).toEqual(['Dinner', 'Italian'])
    expect(recipe.categoryTags?.map((tag) => tag.name)).toEqual([
      'Dinner',
      'Italian',
    ])
  })
})

describe('normalizeRecipeForUi', () => {
  it('fills nullish fields so RecipeModal can render safely', () => {
    const recipe = normalizeRecipeForUi(
      mapDbRowToRecipe(
        makeRow({
          description: null as unknown as string,
          ingredients: null as unknown as string[],
          instructions: null as unknown as string,
        })
      )
    )

    expect(recipe.description).toBe('')
    expect(recipe.ingredients).toEqual([])
    expect(recipe.instructions).toBe('')
  })
})
