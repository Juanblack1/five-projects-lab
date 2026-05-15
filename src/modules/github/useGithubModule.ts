import { useMemo, useState } from 'react'
import { fetchGithubSnapshot, GithubApiError, type GithubSnapshot } from '../../services/githubApi'
import { summarizeGithubEvents } from '../../suiteData'
import {
  defaultGithubRepoFilters,
  filterAndSortGithubRepos,
  getGithubLanguageEntries,
  getGithubRepoStats,
  type GithubRepoFilters,
} from './githubModel'
import type { GithubEvent, GithubProfile, GithubRateLimit, GithubRepo, GithubRequestState } from './githubTypes'

type GithubCopy = {
  cached: (minutes: number) => string
  errorPrefix: string
  loaded: (repos: number) => string
  loading: string
  noEvents: string
  noLanguage: string
  notFound: (username: string) => string
  rateLimited: (time: string) => string
  ready: string
  requestFailed: string
  usernameRequired: string
}

type StoredGithubSnapshot = GithubSnapshot & {
  cachedAt: string
}

const githubCacheKey = 'five-projects-github-cache-v2'
const githubCacheMaxAge = 5 * 60 * 1000

function readGithubCache(): Record<string, StoredGithubSnapshot> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(githubCacheKey)
    return raw ? (JSON.parse(raw) as Record<string, StoredGithubSnapshot>) : {}
  } catch {
    return {}
  }
}

function writeGithubCache(username: string, snapshot: GithubSnapshot) {
  if (typeof window === 'undefined') return

  const cache = readGithubCache()
  cache[username.toLowerCase()] = { ...snapshot, cachedAt: new Date().toISOString() }
  const trimmedEntries = Object.entries(cache)
    .sort((a, b) => b[1].cachedAt.localeCompare(a[1].cachedAt))
    .slice(0, 8)
  window.localStorage.setItem(githubCacheKey, JSON.stringify(Object.fromEntries(trimmedEntries)))
}

function getFreshCachedSnapshot(username: string) {
  const cached = readGithubCache()[username.toLowerCase()]
  if (!cached) return null

  const age = Date.now() - new Date(cached.cachedAt).getTime()
  return age <= githubCacheMaxAge ? cached : null
}

function formatGithubError(error: unknown, username: string, tGithub: GithubCopy, locale: string) {
  if (error instanceof GithubApiError) {
    if (error.reason === 'not-found') return tGithub.notFound(username)
    if (error.reason === 'rate-limit') {
      const resetTime = error.rateLimit.resetAt
        ? new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(error.rateLimit.resetAt))
        : ''
      return tGithub.rateLimited(resetTime)
    }
    return `${tGithub.requestFailed} (${error.endpoint} ${error.status})`
  }

  return tGithub.requestFailed
}

export function useGithubModule(tGithub: GithubCopy, locale: string) {
  const [githubUser, setGithubUser] = useState('Juanblack1')
  const [githubEvents, setGithubEvents] = useState<GithubEvent[]>([])
  const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null)
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([])
  const [githubRepoFilters, setGithubRepoFilters] =
    useState<GithubRepoFilters>(defaultGithubRepoFilters)
  const [githubRateLimit, setGithubRateLimit] = useState<GithubRateLimit>({
    limit: null,
    remaining: null,
    resetAt: null,
  })
  const [githubState, setGithubState] = useState<GithubRequestState>('idle')
  const [githubError, setGithubError] = useState('')
  const [githubLoadedAt, setGithubLoadedAt] = useState<Date | null>(null)
  const [githubCacheMessage, setGithubCacheMessage] = useState('')

  const noLanguageLabel = tGithub.noLanguage
  const githubReport = summarizeGithubEvents(githubEvents)
  const githubLanguages = useMemo(
    () => getGithubLanguageEntries(githubRepos, noLanguageLabel),
    [githubRepos, noLanguageLabel],
  )
  const githubLanguageOptions = useMemo(
    () => githubLanguages.map(([languageName]) => languageName),
    [githubLanguages],
  )
  const filteredGithubRepos = useMemo(
    () => filterAndSortGithubRepos(githubRepos, githubRepoFilters, noLanguageLabel),
    [githubRepoFilters, githubRepos, noLanguageLabel],
  )
  const githubEventTypes = Object.entries(githubReport.byType).sort((a, b) => b[1] - a[1])
  const maxGithubEventCount = Math.max(...githubEventTypes.map((entry) => entry[1]), 1)
  const { forks: githubForks, latestRepo, stars: githubStars } = getGithubRepoStats(githubRepos)

  function applySnapshot(snapshot: GithubSnapshot, loadedAt = new Date(), cacheMessage = '') {
    setGithubProfile(snapshot.profile)
    setGithubEvents(snapshot.events)
    setGithubRepos(snapshot.repos)
    setGithubRateLimit(snapshot.rateLimit)
    setGithubLoadedAt(loadedAt)
    setGithubCacheMessage(cacheMessage)
    setGithubState('success')
  }

  async function fetchGithubEvents() {
    const username = githubUser.trim()
    if (!username) {
      setGithubState('error')
      setGithubError(tGithub.usernameRequired)
      return
    }

    const cached = getFreshCachedSnapshot(username)
    if (cached) {
      const ageMinutes = Math.max(1, Math.round((Date.now() - new Date(cached.cachedAt).getTime()) / 60000))
      applySnapshot(cached, new Date(cached.cachedAt), tGithub.cached(ageMinutes))
      setGithubError('')
      return
    }

    setGithubState('loading')
    setGithubError('')
    setGithubCacheMessage('')
    try {
      const snapshot = await fetchGithubSnapshot(username)
      writeGithubCache(username, snapshot)
      applySnapshot(snapshot)
    } catch (error) {
      setGithubEvents([])
      setGithubProfile(null)
      setGithubRepos([])
      setGithubState('error')
      setGithubCacheMessage('')
      setGithubError(formatGithubError(error, username, tGithub, locale))
      if (error instanceof GithubApiError) {
        setGithubRateLimit(error.rateLimit)
      }
    }
  }

  function getGithubStatus() {
    if (githubState === 'loading') return tGithub.loading
    if (githubState === 'error') return `${tGithub.errorPrefix} ${githubError}`
    if (githubState === 'success') {
      return githubCacheMessage || tGithub.loaded(githubRepos.length)
    }
    return tGithub.ready
  }

  return {
    fetchGithubEvents,
    filteredGithubRepos,
    getGithubStatus,
    githubCacheMessage,
    githubError,
    githubEventTypes,
    githubEvents,
    githubForks,
    githubLanguageOptions,
    githubLanguages,
    githubLoadedAt,
    githubProfile,
    githubRateLimit,
    githubRepoFilters,
    githubReport,
    githubRepos,
    githubStars,
    githubState,
    githubUser,
    latestRepo,
    maxGithubEventCount,
    setGithubRepoFilters,
    setGithubUser,
  }
}
