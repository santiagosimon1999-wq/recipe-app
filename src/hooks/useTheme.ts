import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('app--light', 'app--dark')
  root.classList.add(`app--${theme}`)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme')
    const resolved: Theme =
      storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light'
    applyThemeToDocument(resolved)
    return resolved
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    applyThemeToDocument(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, setTheme, toggleTheme }
}
