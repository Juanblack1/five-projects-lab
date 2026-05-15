import { supportedLanguages, type Language } from '../../hooks/useLanguagePreference'

type LanguageSwitchProps = {
  activeLanguage: Language
  label: string
  onChange: (language: Language) => void
}

export function LanguageSwitch({ activeLanguage, label, onChange }: LanguageSwitchProps) {
  return (
    <div className="language-switch" role="group" aria-label={label}>
      {supportedLanguages.map((option) => (
        <button
          aria-pressed={activeLanguage === option}
          className={activeLanguage === option ? 'active' : ''}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option === 'pt-BR' ? 'PT-BR' : 'EN'}
        </button>
      ))}
    </div>
  )
}
