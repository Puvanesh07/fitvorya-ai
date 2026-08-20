import { createContext, useContext, useEffect, type ReactNode } from 'react'

type Theme = 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always dark — remove light class and persist dark
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
    localStorage.setItem('ft-theme', 'dark')
  }, [])

  // toggleTheme is a no-op; kept for interface compatibility
  function toggleTheme() {}

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
