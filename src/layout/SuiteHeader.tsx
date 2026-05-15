import { type Language } from '../hooks/useLanguagePreference'
import type { ThemePreference } from '../hooks/useThemePreference'
import { LanguageSwitch } from '../shared/components/LanguageSwitch'
import { ThemeSwitch } from '../shared/components/ThemeSwitch'

type SuiteHeaderProps = {
  eyebrow: string
  language: Language
  languageLabel: string
  onLanguageChange: (language: Language) => void
  onThemeChange: (theme: ThemePreference) => void
  subtitle: string
  theme: ThemePreference
  themeLabel: string
  themeLabels: Record<ThemePreference, string>
  title: string
}

export function SuiteHeader({
  eyebrow,
  language,
  languageLabel,
  onLanguageChange,
  onThemeChange,
  subtitle,
  theme,
  themeLabel,
  themeLabels,
  title,
}: SuiteHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="lab-title">{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="shell-controls">
        <ThemeSwitch activeTheme={theme} label={themeLabel} labels={themeLabels} onChange={onThemeChange} />
        <LanguageSwitch activeLanguage={language} label={languageLabel} onChange={onLanguageChange} />
      </div>
    </header>
  )
}
