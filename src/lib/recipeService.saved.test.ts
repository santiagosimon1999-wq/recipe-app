import { beforeEach, describe, expect, it, vi } from 'vitest'

type SavedRecipesRow = {
  created_at: string
  recipe: Record<string, unknown> | null
}

let savedRecipesRows: SavedRecipesRow[] = []
let recipeCategoryRows: Array<{
  recipe_id: number
  categories?: {
    id: number
    name: string
    slug: string
    icon: string | null
    category_groups?: { key: string; label: string } | null
  } | null
}> = []

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn((table: string) => {
    if (table === 'saved_recipes') {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        order: vi.fn(async () => ({ data: savedRecipesRows, error: null })),
      }
      return query
    }

    if (table === 'recipe_categories') {
      const query = {
        select: vi.fn(() => query),
        in: vi.fn(async () => ({ data: recipeCategoryRows, error: null })),
      }
      return query
    }

    throw new Error(`Unexpected table requested in test: ${table}`)
  }),
}))

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { getSavedRecipesForUser } from './recipeService'

describe('getSavedRecipesForUser', () => {
  beforeEach(() => {
    savedRecipesRows = []
    recipeCategoryRows = []
    fromMock.mockClear()
  })

  it('fetches saved recipes directly from saved_recipes joins', async () => {
    savedRecipesRows = [
      {
        created_at: '2026-01-01T00:00:00.000Z',
        recipe: {
          id: 42,
          user_id: 'author-1',
          author_id: 'author-1',
          author_name: null,
          title: 'Spicy Noodles',
          description: 'Great weeknight meal',
          ingredients: ['noodles'],
          instructions: 'Cook and enjoy',
          category: 'Dinner',
          image_url: null,
          calories: 450,
          protein: 20,
          carbs: 60,
          fat: 12,
          is_public: true,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          author: {
            username: 'chefmax',
            display_name: 'Chef Max',
          },
        },
      },
      {
        created_at: '2026-01-01T00:00:00.000Z',
        recipe: null,
      },
    ]

    const recipes = await getSavedRecipesForUser('user-1')

    expect(fromMock).toHaveBeenCalledWith('saved_recipes')
    expect(recipes).toHaveLength(1)
    expect(recipes[0].id).toBe(42)
    expect(recipes[0].title).toBe('Spicy Noodles')
  })

  it('returns an empty array when user has no saved recipes', async () => {
    savedRecipesRows = []

    const recipes = await getSavedRecipesForUser('user-1')

    expect(recipes).toEqual([])
  })

  it('throws when user id is missing', async () => {
    await expect(getSavedRecipesForUser('')).rejects.toThrow(
      'getSavedRecipesForUser requires an authenticated user id'
    )
  })
})
