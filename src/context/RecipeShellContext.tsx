import { createContext, useContext, type ReactNode } from 'react'
import type { Recipe } from '../types/Recipe'

export type RecipeShellContextValue = {
  onSelectRecipe: (recipe: Recipe) => void
  onViewAuthor: (username: string) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const RecipeShellContext = createContext<
  RecipeShellContextValue | undefined
>(undefined)

export function RecipeShellProvider({
  value,
  children,
}: {
  value: RecipeShellContextValue
  children: ReactNode
}) {
  return (
    <RecipeShellContext.Provider value={value}>
      {children}
    </RecipeShellContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecipeShell() {
  const value = useContext(RecipeShellContext)

  if (!value) {
    throw new Error('useRecipeShell must be used within RecipeShellContext')
  }

  return value
}
