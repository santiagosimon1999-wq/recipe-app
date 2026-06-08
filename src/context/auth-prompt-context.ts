import { createContext } from 'react'

type AuthPromptOptions = {
  reason?: string
}

export type AuthPromptContextValue = {
  promptAuth: (options?: AuthPromptOptions) => void
}

export const AuthPromptContext = createContext<AuthPromptContextValue | null>(null)
