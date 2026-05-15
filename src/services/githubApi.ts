import type { GithubEvent, GithubProfile, GithubRateLimit, GithubRepo } from '../modules/github/githubTypes'

export type GithubSnapshot = {
  events: GithubEvent[]
  profile: GithubProfile
  rateLimit: GithubRateLimit
  repos: GithubRepo[]
}

export class GithubApiError extends Error {
  endpoint: string
  rateLimit: GithubRateLimit
  reason: 'not-found' | 'rate-limit' | 'request'
  status: number

  constructor(
    message: string,
    status: number,
    endpoint: string,
    reason: GithubApiError['reason'],
    rateLimit: GithubRateLimit,
  ) {
    super(message)
    this.endpoint = endpoint
    this.rateLimit = rateLimit
    this.reason = reason
    this.status = status
  }
}

function readRateLimit(response: Response): GithubRateLimit {
  const limit = response.headers.get('x-ratelimit-limit')
  const remaining = response.headers.get('x-ratelimit-remaining')
  const reset = response.headers.get('x-ratelimit-reset')
  const resetTimestamp = reset ? Number(reset) : NaN

  return {
    limit: limit === null ? null : Number(limit),
    remaining: remaining === null ? null : Number(remaining),
    resetAt: Number.isFinite(resetTimestamp) ? new Date(resetTimestamp * 1000).toISOString() : null,
  }
}

function mergeRateLimits(...rateLimits: GithubRateLimit[]) {
  return rateLimits.reduce<GithubRateLimit>(
    (summary, item) => ({
      limit: item.limit ?? summary.limit,
      remaining:
        item.remaining === null || summary.remaining === null
          ? item.remaining ?? summary.remaining
          : Math.min(summary.remaining, item.remaining),
      resetAt: item.resetAt ?? summary.resetAt,
    }),
    { limit: null, remaining: null, resetAt: null },
  )
}

async function fetchGithubJson<T>(url: string, endpoint: string): Promise<{ data: T; rateLimit: GithubRateLimit }> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })
  const rateLimit = readRateLimit(response)

  if (!response.ok) {
    const reason =
      response.status === 404
        ? 'not-found'
        : response.status === 403 || response.status === 429 || rateLimit.remaining === 0
          ? 'rate-limit'
          : 'request'
    throw new GithubApiError(`${endpoint} ${response.status}`, response.status, endpoint, reason, rateLimit)
  }

  return { data: (await response.json()) as T, rateLimit }
}

export async function fetchGithubSnapshot(username: string): Promise<GithubSnapshot> {
  const encodedUsername = encodeURIComponent(username)
  const profileResult = await fetchGithubJson<GithubProfile>(
    `https://api.github.com/users/${encodedUsername}`,
    'profile',
  )
  const [eventsResult, reposResult] = await Promise.all([
    fetchGithubJson<GithubEvent[]>(
      `https://api.github.com/users/${encodedUsername}/events/public?per_page=8`,
      'events',
    ),
    fetchGithubJson<GithubRepo[]>(
      `https://api.github.com/users/${encodedUsername}/repos?sort=updated&per_page=30`,
      'repos',
    ),
  ])

  return {
    events: eventsResult.data,
    profile: profileResult.data,
    rateLimit: mergeRateLimits(profileResult.rateLimit, eventsResult.rateLimit, reposResult.rateLimit),
    repos: reposResult.data,
  }
}
