import { Moon, Sun } from 'lucide-react'
import { supportedThemes, type ThemePreference } from '../../hooks/useThemePreference'
import { Button } from './ui/button'

type ThemeSwitchProps = {
  activeTheme: ThemePreference
  label: string
  labels: Record<ThemePreference, string>
  onChange: (theme: ThemePreference) => void
}

const themeIcons = {
  dark: Moon,
  light: Sun,
}

export function ThemeSwitch({ activeTheme, label, labels, onChange }: ThemeSwitchProps) {
  return (
    <div className="theme-switch" role="group" aria-label={label}>
      {supportedThemes.map((option) => {
        const Icon = themeIcons[option]
        return (
          <Button
            aria-pressed={activeTheme === option}
            className={activeTheme === option ? 'active' : ''}
            key={option}
            onClick={() => onChange(option)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
            <span>{labels[option]}</span>
          </Button>
        )
      })}
    </div>
  )
}
