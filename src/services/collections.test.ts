import { beforeEach, describe, expect, it, vi } from 'vitest'

let collectionLookup: { id: string } | null = { id: 'collection-1' }
let deleteError: { message: string } | null = null

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn((table: string) => {
    if (table === 'collections') {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        maybeSingle: vi.fn(async () => ({
          data: collectionLookup,
          error: null,
        })),
      }
      return query
    }

    if (table === 'collection_recipes') {
      const query = {
        delete: vi.fn(() => query),
        eq: vi.fn(() => query),
        then: undefined,
      }

      query.eq = vi.fn(() => ({
        eq: vi.fn(async () => ({ error: deleteError })),
      }))

      return query
    }

    throw new Error(`Unexpected table requested in test: ${table}`)
  }),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { removeRecipeFromCollection } from './collections'

describe('removeRecipeFromCollection', () => {
  beforeEach(() => {
    collectionLookup = { id: 'collection-1' }
    deleteError = null
    fromMock.mockClear()
  })

  it('removes a recipe link when the collection belongs to the user', async () => {
    await expect(
      removeRecipeFromCollection('user-1', 'collection-1', 42)
    ).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledWith('collections')
    expect(fromMock).toHaveBeenCalledWith('collection_recipes')
  })

  it('no-ops when the collection is not found for the user', async () => {
    collectionLookup = null

    await expect(
      removeRecipeFromCollection('user-1', 'missing-collection', 42)
    ).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledWith('collections')
  })
})
