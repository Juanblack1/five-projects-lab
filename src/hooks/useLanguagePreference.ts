import { useEffect, useState } from 'react'

export type Language = 'pt-BR' | 'en'

const languageStorageKey = 'five-projects-language'

export const supportedLanguages: Language[] = ['pt-BR', 'en']

export const localeByLanguage: Record<Language, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
}

export const currencyByLanguage: Record<Language, string> = {
  'pt-BR': 'BRL',
  en: 'USD',
}

function getInitialLanguage(): Language {
  const stored = window.localStorage.getItem(languageStorageKey)
  if (stored === 'pt-BR' || stored === 'en') return stored
  return window.navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

export function useLanguagePreference() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language)
    document.documentElement.lang = language
  }, [language])

  return { language, setLanguage }
}
