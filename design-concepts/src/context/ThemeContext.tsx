import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type VisualTheme = 'atlas' | 'atelje'

type ThemeContextValue = {
  theme: VisualTheme
  setTheme: (theme: VisualTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'stadora-theme'

function readTheme(): VisualTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'atlas' ? 'atlas' : 'atelje'
  } catch {
    return 'atelje'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<VisualTheme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}
