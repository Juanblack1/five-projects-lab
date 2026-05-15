import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { formatEventType } from '../../utils/formatters'
import {
  githubRepoSortOrder,
  type GithubRepoFilters,
  type GithubRepoSortKey,
} from './githubModel'
import type { GithubEvent, GithubProfile, GithubRateLimit, GithubRepo, GithubRequestState } from './githubTypes'

type GithubCopy = {
  analyze: string
  allLanguages: string
  cachedLabel: string
  emptyBio: string
  emptyEvents: string
  emptyProfile: string
  eventTypes: string
  events: string
  filterRepos: string
  followers: string
  following: string
  forks: string
  languages: string
  latestRepos: string
  loading: string
  location: string
  noLanguage: string
  openProfile: string
  openRepo: string
  profile: string
  publicRepos: string
  rateLimit: string
  rateLimitReset: string
  repoEmpty: string
  repoFilteredEmpty: string
  repoNoDescription: string
  repos: string
  searchPlaceholder: string
  sort: string
  sortOptions: Record<GithubRepoSortKey, string>
  stars: string
  topLanguage: string
  updated: string
  username: string
}

type GithubModuleProps = {
  eventRepoCount: number
  filteredGithubRepos: GithubRepo[]
  githubErrorState: GithubRequestState
  githubEventTypes: [string, number][]
  githubEvents: GithubEvent[]
  githubForks: number
  githubLanguageOptions: string[]
  githubLanguages: [string, number][]
  githubLoadedAt: Date | null
  githubProfile: GithubProfile | null
  githubRateLimit: GithubRateLimit
  githubRepoFilters: GithubRepoFilters
  githubRepos: GithubRepo[]
  githubStars: number
  githubStatus: string
  githubUser: string
  latestRepo: GithubRepo | undefined
  locale: string
  maxGithubEventCount: number
  onFetchGithubEvents: () => void
  setGithubRepoFilters: Dispatch<SetStateAction<GithubRepoFilters>>
  setGithubUser: (value: string) => void
  tGithub: GithubCopy
  title: string
}

function formatCompactDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
}

function formatRateReset(rateLimit: GithubRateLimit, locale: string) {
  if (!rateLimit.resetAt) return '-'
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(rateLimit.resetAt))
}

function SkeletonRepoCards() {
  return (
    <div className="repo-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <article className="repo-card github-skeleton-card" key={index}>
          <span />
          <strong />
          <p />
          <small />
        </article>
      ))}
    </div>
  )
}

export function GithubModule({
  eventRepoCount,
  filteredGithubRepos,
  githubErrorState,
  githubEventTypes,
  githubEvents,
  githubForks,
  githubLanguageOptions,
  githubLanguages,
  githubLoadedAt,
  githubProfile,
  githubRateLimit,
  githubRepoFilters,
  githubRepos,
  githubStars,
  githubStatus,
  githubUser,
  latestRepo,
  locale,
  maxGithubEventCount,
  onFetchGithubEvents,
  setGithubRepoFilters,
  setGithubUser,
  tGithub,
  title,
}: GithubModuleProps) {
  const isLoading = githubErrorState === 'loading'
  const hasRepos = githubRepos.length > 0
  const hasFilteredRepos = filteredGithubRepos.length > 0

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoading) onFetchGithubEvents()
  }

  return (
    <section aria-busy={isLoading} aria-label={title} className="panel github-panel">
      <form className="github-search-card" onSubmit={submitSearch}>
        <label>
          <span>{tGithub.username}</span>
          <input
            autoCapitalize="none"
            autoComplete="off"
            onChange={(event) => setGithubUser(event.target.value)}
            placeholder={tGithub.searchPlaceholder}
            spellCheck={false}
            value={githubUser}
          />
        </label>
        <button className="primary-action" disabled={isLoading} type="submit">
          {isLoading ? tGithub.loading : tGithub.analyze}
        </button>
      </form>

      <p className={githubErrorState === 'error' ? 'status-line error' : 'status-line'} role="status">
        {githubStatus}
      </p>

      <section className="github-hero-grid">
        <article className="profile-card github-profile-card">
          {githubProfile?.avatar_url ? (
            <img alt="" src={githubProfile.avatar_url} />
          ) : (
            <div className="avatar-fallback">{githubUser.slice(0, 2).toUpperCase()}</div>
          )}
          <div>
            <span>{tGithub.profile}</span>
            <strong>{githubProfile?.name || githubProfile?.login || githubUser}</strong>
            {githubProfile?.login && <b>@{githubProfile.login}</b>}
            <p>{githubProfile ? githubProfile.bio || tGithub.emptyBio : tGithub.emptyProfile}</p>
            <div className="github-profile-meta">
              <span>{githubProfile?.location || tGithub.location}</span>
              <span>{githubProfile?.public_repos ?? eventRepoCount} {tGithub.repos}</span>
            </div>
            {githubProfile?.html_url && (
              <a href={githubProfile.html_url} rel="noreferrer" target="_blank">
                {tGithub.openProfile}
              </a>
            )}
          </div>
        </article>

        <div className="metric-grid compact github-metrics">
          <article>
            <span>{tGithub.followers}</span>
            <strong>{githubProfile?.followers ?? 0}</strong>
          </article>
          <article>
            <span>{tGithub.following}</span>
            <strong>{githubProfile?.following ?? 0}</strong>
          </article>
          <article>
            <span>{tGithub.publicRepos}</span>
            <strong>{githubProfile?.public_repos ?? githubRepos.length}</strong>
          </article>
          <article>
            <span>{tGithub.stars}</span>
            <strong>{githubStars}</strong>
          </article>
          <article>
            <span>{tGithub.forks}</span>
            <strong>{githubForks}</strong>
          </article>
          <article>
            <span>{tGithub.updated}</span>
            <strong>{latestRepo ? formatCompactDate(latestRepo.updated_at, locale) : '-'}</strong>
          </article>
        </div>
      </section>

      <section className="github-repo-toolbar" aria-label={tGithub.filterRepos}>
        <label>
          <span>{tGithub.filterRepos}</span>
          <input
            onChange={(event) =>
              setGithubRepoFilters((filters) => ({ ...filters, query: event.target.value }))
            }
            placeholder={tGithub.searchPlaceholder}
            value={githubRepoFilters.query}
          />
        </label>
        <label>
          <span>{tGithub.languages}</span>
          <select
            onChange={(event) =>
              setGithubRepoFilters((filters) => ({ ...filters, language: event.target.value }))
            }
            value={githubRepoFilters.language}
          >
            <option value="all">{tGithub.allLanguages}</option>
            {githubLanguageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{tGithub.sort}</span>
          <select
            onChange={(event) =>
              setGithubRepoFilters((filters) => ({
                ...filters,
                sort: event.target.value as GithubRepoSortKey,
              }))
            }
            value={githubRepoFilters.sort}
          >
            {githubRepoSortOrder.map((sort) => (
              <option key={sort} value={sort}>
                {tGithub.sortOptions[sort]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="github-main-grid">
        <section className="repo-section" aria-label={tGithub.latestRepos}>
          <div className="section-head">
            <h3>{tGithub.latestRepos}</h3>
            <span>{filteredGithubRepos.length} / {githubRepos.length}</span>
          </div>

          {isLoading && <SkeletonRepoCards />}

          {!isLoading && !hasRepos && githubErrorState === 'success' && (
            <article className="github-empty-state">
              <strong>{tGithub.repoEmpty}</strong>
              <p>{tGithub.emptyProfile}</p>
            </article>
          )}

          {!isLoading && hasRepos && !hasFilteredRepos && (
            <article className="github-empty-state">
              <strong>{tGithub.repoFilteredEmpty}</strong>
              <p>{tGithub.repoEmpty}</p>
            </article>
          )}

          {!isLoading && hasFilteredRepos && (
            <div className="repo-grid">
              {filteredGithubRepos.map((repo) => (
                <a className="repo-card github-repo-card" href={repo.html_url} key={repo.id} rel="noreferrer" target="_blank">
                  <span>{repo.language || tGithub.noLanguage}</span>
                  <strong>{repo.name}</strong>
                  <p>{repo.description || tGithub.repoNoDescription}</p>
                  <small>
                    {tGithub.stars}: {repo.stargazers_count} · {tGithub.forks}: {repo.forks_count}
                  </small>
                  <small>{tGithub.updated}: {formatCompactDate(repo.updated_at, locale)}</small>
                  <b>{tGithub.openRepo}</b>
                </a>
              ))}
            </div>
          )}
        </section>

        <aside className="github-side-panel">
          <article className="module-card github-rate-card">
            <span>{tGithub.rateLimit}</span>
            <strong>{githubRateLimit.remaining ?? '-'}</strong>
            <p>
              {githubRateLimit.limit ?? '-'} max · {tGithub.rateLimitReset} {formatRateReset(githubRateLimit, locale)}
            </p>
          </article>

          <article className="module-card">
            <span>{tGithub.languages}</span>
            <div className="bar-stack">
              {githubLanguages.length === 0 && <p className="empty-line">{tGithub.repoEmpty}</p>}
              {githubLanguages.map(([name, count]) => (
                <div className="bar-row" key={name}>
                  <p>
                    <b>{name}</b>
                    <em>{count}</em>
                  </p>
                  <i style={{ width: `${Math.round((count / Math.max(githubRepos.length, 1)) * 100)}%` }} />
                </div>
              ))}
            </div>
          </article>

          <article className="module-card">
            <span>{tGithub.eventTypes}</span>
            <div className="bar-stack">
              {githubEventTypes.length === 0 && <p className="empty-line">{tGithub.emptyEvents}</p>}
              {githubEventTypes.map(([type, count]) => (
                <div className="bar-row" key={type}>
                  <p>
                    <b>{formatEventType(type)}</b>
                    <em>{count}</em>
                  </p>
                  <i style={{ width: `${Math.round((count / maxGithubEventCount) * 100)}%` }} />
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="event-list github-events" aria-label={tGithub.events}>
        {githubEvents.length === 0 && githubErrorState === 'success' && (
          <p className="empty-line">{tGithub.emptyEvents}</p>
        )}
        {githubEvents.map((event) => (
          <article key={event.id}>
            <strong>{formatEventType(event.type)}</strong>
            <span>{event.repo?.name ?? 'Unknown repo'}</span>
            <time dateTime={event.created_at}>
              {new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(event.created_at))}
            </time>
          </article>
        ))}
      </section>

      {githubLoadedAt && (
        <p className="subtle-line">
          {tGithub.cachedLabel}:{' '}
          {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(githubLoadedAt)}
        </p>
      )}
    </section>
  )
}
