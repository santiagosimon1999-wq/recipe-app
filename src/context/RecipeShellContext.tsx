import { createContext, useContext, type ReactNode } from 'react'
import type { Recipe } from '../types/Recipe'

export type RecipeShellContextValue = {
  onSelectRecipe: (recipe: Recipe) => void
  onViewAuthor: (username: string) => void
}

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

export function useRecipeShell() {
  const value = useContext(RecipeShellContext)

  if (!value) {
    throw new Error('useRecipeShell must be used within RecipeShellContext')
  }

  return value
}
