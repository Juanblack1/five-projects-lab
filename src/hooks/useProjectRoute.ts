import { useEffect, useState } from 'react'
import { suiteProjects, type ProjectKey } from '../suiteData'

type SuiteView = 'intro' | 'lab'

export function isProjectKey(value: string): value is ProjectKey {
  return suiteProjects.some((project) => project.key === value)
}

function getInitialProject(): ProjectKey {
  const value = window.location.hash.replace('#', '')
  return isProjectKey(value) ? value : 'focus'
}

function getInitialView(): SuiteView {
  const value = window.location.hash.replace('#', '')
  return isProjectKey(value) ? 'lab' : 'intro'
}

function scrollToTop(behavior: ScrollBehavior = 'smooth') {
  window.requestAnimationFrame(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ behavior: reduceMotion ? 'auto' : behavior, top: 0 })
  })
}

export function useProjectRoute() {
  const [activeProject, setActiveProject] = useState<ProjectKey>(getInitialProject)
  const [suiteView, setSuiteView] = useState<SuiteView>(getInitialView)

  useEffect(() => {
    const updateFromHash = () => {
      const value = window.location.hash.replace('#', '')
      if (isProjectKey(value)) {
        setActiveProject(value)
        setSuiteView('lab')
        scrollToTop('auto')
      } else {
        setSuiteView('intro')
        scrollToTop('auto')
      }
    }

    window.addEventListener('hashchange', updateFromHash)
    return () => window.removeEventListener('hashchange', updateFromHash)
  }, [])

  useEffect(() => {
    const value = window.location.hash.replace('#', '')
    if (isProjectKey(value)) {
      scrollToTop('auto')
    }
  }, [])

  function changeProject(project: ProjectKey) {
    setActiveProject(project)
    setSuiteView('lab')
    if (window.location.hash !== `#${project}`) {
      window.history.replaceState(null, '', `#${project}`)
    }
  }

  function openLab(project: ProjectKey = activeProject) {
    changeProject(project)
    scrollToTop('smooth')
  }

  function openIntro() {
    setSuiteView('intro')
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    scrollToTop('smooth')
  }

  return { activeProject, changeProject, openIntro, openLab, suiteView }
}
