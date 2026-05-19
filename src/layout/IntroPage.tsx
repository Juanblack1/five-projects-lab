import type { CSSProperties } from 'react'
import { useState } from 'react'
import { type Language } from '../hooks/useLanguagePreference'
import type { ThemePreference } from '../hooks/useThemePreference'
import { LanguageSwitch } from '../shared/components/LanguageSwitch'
import { ThemeSwitch } from '../shared/components/ThemeSwitch'
import { Badge } from '../shared/components/ui/badge'
import { Button } from '../shared/components/ui/button'
import { Card } from '../shared/components/ui/card'
import { suiteProjects, type ProjectKey } from '../suiteData'

type IntroCopy = {
  body: string
  eyebrow: string
  modulesTitle: string
  primary: string
  preview: string
  moduleAction: string
  secondary: string
  signal: string
  stats: string[]
  subtitle: string
  title: string
}

type ProjectCopy = {
  kicker: string
  summary: string
  title: string
}

const moduleVisuals: Record<ProjectKey, { mark: string; meta: string }> = {
  budget: { mark: '$', meta: 'FIN' },
  csv: { mark: 'CSV', meta: 'DATA' },
  focus: { mark: '25', meta: 'POMO' },
  github: { mark: '{}', meta: 'API' },
  logs: { mark: '!!', meta: 'OPS' },
}

type IntroPageProps = {
  activeProject: ProjectKey
  appLabel: string
  heroImage: string
  intro: IntroCopy
  language: Language
  languageLabel: string
  onLanguageChange: (language: Language) => void
  onOpenLab: (project?: ProjectKey) => void
  onThemeChange: (theme: ThemePreference) => void
  projectCopies: Record<ProjectKey, ProjectCopy>
  theme: ThemePreference
  themeLabel: string
  themeLabels: Record<ThemePreference, string>
}

export function IntroPage({
  activeProject,
  appLabel,
  heroImage,
  intro,
  language,
  languageLabel,
  onLanguageChange,
  onOpenLab,
  onThemeChange,
  projectCopies,
  theme,
  themeLabel,
  themeLabels,
}: IntroPageProps) {
  const selectedProjectCopy = projectCopies[activeProject]
  const [pressedProject, setPressedProject] = useState<ProjectKey | null>(null)

  function openModule(project: ProjectKey) {
    setPressedProject(project)
    window.setTimeout(() => setPressedProject(null), 240)
    onOpenLab(project)
  }

  function scrollToModules() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('intro-modules-title')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="intro-screen" aria-labelledby="intro-title">
      <div className="intro-backdrop" aria-hidden="true">
        <span className="intro-line intro-line-a" />
        <span className="intro-line intro-line-b" />
        <span className="intro-pulse intro-pulse-a" />
        <span className="intro-pulse intro-pulse-b" />
      </div>

      <header className="intro-nav">
        <div className="intro-brand">
          <img alt="" src={heroImage} />
          <span>{appLabel}</span>
        </div>
        <div className="shell-controls">
          <ThemeSwitch
            activeTheme={theme}
            label={themeLabel}
            labels={themeLabels}
            onChange={onThemeChange}
          />
          <LanguageSwitch activeLanguage={language} label={languageLabel} onChange={onLanguageChange} />
        </div>
      </header>

      <div className="intro-content">
        <div className="intro-copy">
          <p className="eyebrow">{intro.eyebrow}</p>
          <h1 id="intro-title">{intro.title}</h1>
          <p>{intro.subtitle}</p>
          <p>{intro.body}</p>
          <div className="intro-actions">
            <Button className="primary-action" onClick={() => onOpenLab()} size="lg" type="button">
              {intro.primary}
            </Button>
            <Button onClick={scrollToModules} size="lg" type="button" variant="outline">
              {intro.secondary}
            </Button>
          </div>
          <div className="intro-stats" aria-label={intro.signal}>
            {intro.stats.map((stat) => (
              <Badge key={stat} variant="outline">
                {stat}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="intro-console border-white/15 bg-white/10 text-white" aria-label={intro.preview}>
          <span>{intro.preview}</span>
          <strong>{selectedProjectCopy.title}</strong>
          <p>{selectedProjectCopy.summary}</p>
          <img alt="" src={heroImage} />
          <div className="intro-spectrum" aria-hidden="true">
            {suiteProjects.map((project) => (
              <i key={project.key} style={{ '--accent': project.accent } as CSSProperties} />
            ))}
          </div>
        </Card>
      </div>

      <section className="intro-modules" aria-labelledby="intro-modules-title">
        <div className="intro-modules-head">
          <span>{intro.signal}</span>
          <h2 id="intro-modules-title">{intro.modulesTitle}</h2>
          <p>{intro.body}</p>
        </div>

        <div className="intro-module-grid">
          {suiteProjects.map((project, index) => {
            const item = projectCopies[project.key]
            const visual = moduleVisuals[project.key]
            const isActive = project.key === activeProject
            const isPressed = project.key === pressedProject

            return (
              <button
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${intro.moduleAction}: ${item.title}`}
                className={`intro-module-card${isActive ? ' active' : ''}${isPressed ? ' pressed' : ''}`}
                key={project.key}
                onClick={() => openModule(project.key)}
                style={{ '--accent': project.accent } as CSSProperties}
                type="button"
              >
                <span className="intro-module-scan" aria-hidden="true" />
                <span className="intro-module-top">
                  <span className="intro-module-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="intro-module-category">{item.kicker}</span>
                </span>
                <span className="intro-module-visual" aria-hidden="true">
                  <b>{visual.mark}</b>
                  <i>{visual.meta}</i>
                </span>
                <strong>{item.title}</strong>
                <small>{item.summary}</small>
                <span className="intro-module-action">{intro.moduleAction}</span>
              </button>
            )
          })}
        </div>
      </section>
    </section>
  )
}
