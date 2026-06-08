import { beforeEach, describe, expect, it, vi } from 'vitest'

let collectionLookup: { id: string } | null = { id: 'collection-1' }
let deleteError: { message: string } | null = null
let renameResult: { data: { id: string; name: string } | null; error: unknown } = {
  data: { id: 'collection-1', name: 'Weeknight Dinners' },
  error: null,
}

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn((table: string) => {
    if (table === 'collections') {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        update: vi.fn(() => query),
        maybeSingle: vi.fn(async () => ({
          data: collectionLookup,
          error: null,
        })),
        single: vi.fn(async () => renameResult),
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

import {
  removeRecipeFromCollection,
  renameCollection,
  validateCollectionName,
} from './collections'

describe('validateCollectionName', () => {
  it('trims whitespace and returns a valid name', () => {
    expect(validateCollectionName('  Weeknight Dinners  ')).toBe('Weeknight Dinners')
  })

  it('rejects empty names', () => {
    expect(() => validateCollectionName('   ')).toThrow(/required/i)
  })
})

describe('renameCollection', () => {
  beforeEach(() => {
    collectionLookup = { id: 'collection-1' }
    deleteError = null
    renameResult = {
      data: { id: 'collection-1', name: 'Weeknight Dinners' },
      error: null,
    }
    fromMock.mockClear()
  })

  it('updates the collection name for the current user', async () => {
    const result = await renameCollection(
      'user-1',
      'collection-1',
      '  Weeknight Dinners  '
    )

    expect(result).toEqual({
      id: 'collection-1',
      name: 'Weeknight Dinners',
    })
    expect(fromMock).toHaveBeenCalledWith('collections')
  })

  it('rejects empty names before calling Supabase', async () => {
    await expect(renameCollection('user-1', 'collection-1', '   ')).rejects.toThrow(
      /required/i
    )
    expect(fromMock).not.toHaveBeenCalled()
  })
})

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
