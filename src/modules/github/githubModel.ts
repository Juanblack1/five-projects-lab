import type { GithubRepo } from './githubTypes'

export type GithubRepoSortKey = 'language' | 'name' | 'recent' | 'stars'

export type GithubRepoFilters = {
  language: string
  query: string
  sort: GithubRepoSortKey
}

export const defaultGithubRepoFilters: GithubRepoFilters = {
  language: 'all',
  query: '',
  sort: 'stars',
}

export const githubRepoSortOrder: GithubRepoSortKey[] = ['stars', 'recent', 'name', 'language']

export function getGithubLanguageLabel(repo: GithubRepo, fallback: string) {
  return repo.language || fallback
}

export function getGithubLanguageEntries(repos: GithubRepo[], fallback: string) {
  return Object.entries(
    repos.reduce<Record<string, number>>((summary, repo) => {
      const language = getGithubLanguageLabel(repo, fallback)
      summary[language] = (summary[language] ?? 0) + 1
      return summary
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

export function getGithubRepoStats(repos: GithubRepo[]) {
  return repos.reduce(
    (summary, repo) => {
      summary.forks += repo.forks_count
      summary.stars += repo.stargazers_count
      if (!summary.latestRepo || repo.updated_at > summary.latestRepo.updated_at) {
        summary.latestRepo = repo
      }
      return summary
    },
    { forks: 0, latestRepo: undefined as GithubRepo | undefined, stars: 0 },
  )
}

export function filterAndSortGithubRepos(
  repos: GithubRepo[],
  filters: GithubRepoFilters,
  noLanguageLabel: string,
) {
  const query = filters.query.trim().toLowerCase()
  const filtered = repos.filter((repo) => {
    const language = getGithubLanguageLabel(repo, noLanguageLabel)
    const matchesLanguage = filters.language === 'all' || language === filters.language
    const matchesQuery =
      query.length === 0 ||
      [repo.name, repo.description ?? '', language].join(' ').toLowerCase().includes(query)

    return matchesLanguage && matchesQuery
  })

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'stars') {
      return b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name)
    }
    if (filters.sort === 'recent') {
      return b.updated_at.localeCompare(a.updated_at) || a.name.localeCompare(b.name)
    }
    if (filters.sort === 'language') {
      return (
        getGithubLanguageLabel(a, noLanguageLabel).localeCompare(getGithubLanguageLabel(b, noLanguageLabel)) ||
        a.name.localeCompare(b.name)
      )
    }
    return a.name.localeCompare(b.name)
  })
}
