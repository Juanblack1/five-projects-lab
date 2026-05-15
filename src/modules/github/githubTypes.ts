export type GithubEvent = {
  id: string
  type: string
  repo?: { name: string }
  created_at: string
}

export type GithubProfile = {
  avatar_url?: string
  bio?: string
  followers?: number
  following?: number
  html_url?: string
  location?: string | null
  login: string
  name?: string
  public_repos?: number
}

export type GithubRepo = {
  description?: string | null
  forks_count: number
  html_url: string
  id: number
  language?: string | null
  name: string
  stargazers_count: number
  updated_at: string
}

export type GithubRateLimit = {
  limit: number | null
  remaining: number | null
  resetAt: string | null
}

export type GithubRequestState = 'error' | 'idle' | 'loading' | 'success'
