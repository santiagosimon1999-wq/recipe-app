import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import SavedRecipesPage from './SavedRecipesPage'
import { useSavedRecipes } from '../hooks/useSavedRecipes'

vi.mock('../hooks/useSavedRecipes', () => ({
  useSavedRecipes: vi.fn(),
}))

type SavedHookReturn = {
  recipes: Array<Record<string, unknown>>
  loading: boolean
  error: string | null
  retry: () => void
}

const mockedUseSavedRecipes = vi.mocked(useSavedRecipes)

function defaultProps() {
  return {
    userId: 'user-1',
    sampleSavedRecipeIds: [] as number[],
    cloudSavedRecipeIds: [] as number[],
    likedRecipeIds: [] as number[],
    likeCountsByRecipeId: {} as Record<number, number>,
    onToggleSaved: vi.fn(),
    onSelectRecipe: vi.fn(),
    onToggleLike: vi.fn(),
    onViewAuthor: vi.fn(),
    onMergeLikeCounts: vi.fn(),
    onMergeLikedRecipeIds: vi.fn(),
  }
}

function findButtonClickHandler(node: ReactNode): (() => void) | null {
  if (!node || typeof node !== 'object') return null

  const element = node as {
    type?: unknown
    props?: { onClick?: () => void; children?: ReactNode }
  }

  if (element.type === 'button' && typeof element.props?.onClick === 'function') {
    return element.props.onClick
  }

  const children = element.props?.children
  if (!children) return null

  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findButtonClickHandler(child)
      if (found) return found
    }
    return null
  }

  return findButtonClickHandler(children)
}

describe('SavedRecipesPage', () => {
  beforeEach(() => {
    mockedUseSavedRecipes.mockReset()
  })

  it('renders loading state while saved recipes are being fetched', () => {
    mockedUseSavedRecipes.mockReturnValue({
      recipes: [],
      loading: true,
      error: null,
      retry: vi.fn(),
    } as SavedHookReturn as ReturnType<typeof useSavedRecipes>)

    const html = renderToStaticMarkup(<SavedRecipesPage {...defaultProps()} />)

    expect(html).toContain('Loading your saved recipes…')
  })

  it('renders empty state when no saved recipes are returned', () => {
    mockedUseSavedRecipes.mockReturnValue({
      recipes: [],
      loading: false,
      error: null,
      retry: vi.fn(),
    } as SavedHookReturn as ReturnType<typeof useSavedRecipes>)

    const html = renderToStaticMarkup(<SavedRecipesPage {...defaultProps()} />)

    expect(html).toContain('You haven’t saved any recipes yet.')
  })

  it('renders error state when retrieval fails', () => {
    mockedUseSavedRecipes.mockReturnValue({
      recipes: [],
      loading: false,
      error: 'Could not load your saved recipes right now.',
      retry: vi.fn(),
    } as SavedHookReturn as ReturnType<typeof useSavedRecipes>)

    const html = renderToStaticMarkup(<SavedRecipesPage {...defaultProps()} />)

    expect(html).toContain('Could not load your saved recipes right now.')
    expect(html).toContain('Retry')
  })

  it('invokes retry handler from the error state button', () => {
    const retry = vi.fn()
    mockedUseSavedRecipes.mockReturnValue({
      recipes: [],
      loading: false,
      error: 'Could not load your saved recipes right now.',
      retry,
    } as SavedHookReturn as ReturnType<typeof useSavedRecipes>)

    const element = SavedRecipesPage(defaultProps())
    const clickHandler = findButtonClickHandler(element)

    expect(clickHandler).not.toBeNull()
    clickHandler?.()
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
