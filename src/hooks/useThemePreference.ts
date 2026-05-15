import { useEffect, useState } from 'react'

export const supportedThemes = ['dark', 'light'] as const
export type ThemePreference = (typeof supportedThemes)[number]

const storageKey = 'five-projects-lab-theme'

function isThemePreference(value: string | null): value is ThemePreference {
  return supportedThemes.some((theme) => theme === value)
}

function getInitialTheme(): ThemePreference {
  const documentTheme = document.documentElement.dataset.theme ?? null
  if (isThemePreference(documentTheme)) return documentTheme

  const stored = localStorage.getItem(storageKey)
  if (isThemePreference(stored)) return stored

  return 'dark'
}

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemePreference>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem(storageKey, theme)
  }, [theme])

  return { setTheme, theme }
}
