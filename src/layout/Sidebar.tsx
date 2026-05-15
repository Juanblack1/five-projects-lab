import type { CSSProperties } from 'react'
import { Home } from 'lucide-react'
import { Button } from '../shared/components/ui/button'
import { suiteProjects, type ProjectKey } from '../suiteData'

type ProjectNavCopy = {
  kicker: string
  title: string
}

type SidebarProps = {
  activeProject: ProjectKey
  appLabel: string
  heroImage: string
  homeLabel: string
  navLabel: string
  onHome: () => void
  onProjectChange: (project: ProjectKey) => void
  projectCopies: Record<ProjectKey, ProjectNavCopy>
  sidebarCopy: string
  title: string
}

export function Sidebar({
  activeProject,
  appLabel,
  heroImage,
  homeLabel,
  navLabel,
  onHome,
  onProjectChange,
  projectCopies,
  sidebarCopy,
  title,
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label={appLabel}>
      <div className="brand-card">
        <img alt="" className="brand-art" src={heroImage} />
        <span>{appLabel}</span>
        <strong>{title}</strong>
        <p>{sidebarCopy}</p>
      </div>

      <nav className="project-rail" aria-label={navLabel}>
        {suiteProjects.map((project, index) => {
          const item = projectCopies[project.key]
          return (
            <button
              aria-current={project.key === activeProject ? 'page' : undefined}
              className={project.key === activeProject ? 'active' : ''}
              key={project.key}
              onClick={() => onProjectChange(project.key)}
              style={{ '--accent': project.accent } as CSSProperties}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              <small>{item.kicker}</small>
            </button>
          )
        })}
      </nav>

      <Button className="sidebar-home" onClick={onHome} type="button" variant="outline">
        <Home aria-hidden="true" size={16} strokeWidth={2.2} />
        {homeLabel}
      </Button>
    </aside>
  )
}
