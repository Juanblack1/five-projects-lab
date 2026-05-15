import { describe, expect, it } from 'vitest'
import {
  calculateBudget,
  parseCsv,
  summarizeGithubEvents,
  summarizeLogs,
  type Transaction,
} from './suiteData'
import { analyzeCsv } from './modules/csv/csvModel'
import { filterAndSortGithubRepos, type GithubRepoFilters } from './modules/github/githubModel'
import type { GithubRepo } from './modules/github/githubTypes'
import { filterLogs, generateSimulatedLogs, parseLogs, summarizeLogEntries } from './modules/logs/logModel'

describe('suite helpers', () => {
  it('calculates income, expenses, balance and categories', () => {
    const transactions: Transaction[] = [
      { amount: 1000, category: 'Income', date: '2026-05-01', id: '1', label: 'Job', type: 'income' },
      { amount: 200, category: 'Tools', date: '2026-05-02', id: '2', label: 'IDE', type: 'expense' },
      { amount: 50, category: 'Tools', date: '2026-05-03', id: '3', label: 'API', type: 'expense' },
    ]

    expect(calculateBudget(transactions)).toMatchObject({
      balance: 750,
      byCategory: { Tools: 250 },
      expense: 250,
      income: 1000,
      largestExpense: transactions[1],
      topExpenseCategory: { amount: 250, category: 'Tools' },
    })
  })

  it('keeps financial totals stable with decimal amounts', () => {
    const transactions: Transaction[] = [
      { amount: 0.3, category: 'Income', date: '2026-05-01', id: '1', label: 'Adjustment', type: 'income' },
      { amount: 0.1, category: 'Fees', date: '2026-05-02', id: '2', label: 'Fee A', type: 'expense' },
      { amount: 0.2, category: 'Fees', date: '2026-05-03', id: '3', label: 'Fee B', type: 'expense' },
    ]

    expect(calculateBudget(transactions)).toMatchObject({
      balance: 0,
      byCategory: { Fees: 0.3 },
      expense: 0.3,
      income: 0.3,
    })
  })

  it('cleans duplicated CSV rows and counts missing cells', () => {
    const result = parseCsv('name,status\nAna,done\nBob,\nAna,done')

    expect(result.rows).toBe(2)
    expect(result.duplicates).toBe(1)
    expect(result.missing).toBe(1)
  })

  it('detects CSV hygiene issues and applies selected cleanup actions', () => {
    const result = analyzeCsv('name, status,\n Ana , done,\nBob,,\nAna,done,\n,,\nExtra,row,value,overflow')

    expect(result).toMatchObject({
      duplicateRows: 1,
      inconsistentRows: 1,
      rowCount: 5,
      unnamedColumns: 2,
    })
    expect(result.emptyCells).toBeGreaterThan(0)
    expect(result.cleaned.split('\n')).toEqual([
      'name,status,column_3,column_4',
      'Ana,done,,',
      'Bob,,,',
      'Extra,row,value,overflow',
    ])
  })

  it('keeps quoted CSV commas intact and reports malformed quoted input', () => {
    const valid = analyzeCsv('name,notes\nAna,"front, end"\nBob,"uses ""quotes"""')
    const invalid = analyzeCsv('name,notes\nAna,"open note')

    expect(valid.cleaned).toContain('Ana,"front, end"')
    expect(valid.cleaned).toContain('Bob,"uses ""quotes"""')
    expect(invalid.parseError).toBe('unclosed-quote')
  })

  it('summarizes logs by severity', () => {
    const result = summarizeLogs('[INFO] ok\n[ERROR] broken\n[WARN] slow', new Date('2026-05-14T12:00:00Z'))

    expect(result.counts).toEqual({ debug: 0, error: 1, info: 1, warn: 1 })
    expect(result.archiveName).toBe('logs-2026-05-14T12-00-00.zip')
  })

  it('parses operational logs with severity, timestamp and source', () => {
    const entries = parseLogs(
      '2026-05-15T10:00:00Z [CRITICAL] [payments] circuit open\n2026-05-15T10:01:00Z [ERROR] [worker] job failed\n[DEBUG] [ui] repaint',
    )
    const summary = summarizeLogEntries(entries, new Date('2026-05-15T12:00:00Z'))

    expect(entries.map((entry) => [entry.severity, entry.source])).toEqual([
      ['critical', 'payments'],
      ['error', 'worker'],
      ['debug', 'ui'],
    ])
    expect(summary.counts).toMatchObject({ critical: 1, debug: 1, error: 1 })
    expect(summary.sources).toEqual({ payments: 1, ui: 1, worker: 1 })
    expect(summary.archiveName).toBe('logs-2026-05-15T12-00-00.txt')
  })

  it('filters logs by text, origin and recent timestamp', () => {
    const now = new Date('2026-05-15T11:00:00Z')
    const entries = parseLogs(
      '2026-05-15T10:30:00Z [ERROR] [api] timeout on /checkout\n2026-05-15T08:00:00Z [ERROR] [api] old timeout\n2026-05-15T10:45:00Z [WARN] [cache] cache miss',
    )

    expect(
      filterLogs(entries, { query: 'timeout', severity: 'error', source: 'api', time: 'lastHour' }, now).map(
        (entry) => entry.message,
      ),
    ).toEqual(['timeout on /checkout'])
  })

  it('generates simulated logs with all operational levels', () => {
    const entries = parseLogs(generateSimulatedLogs(new Date('2026-05-15T12:00:00Z')))

    expect(entries.map((entry) => entry.severity)).toEqual(['info', 'warn', 'error', 'critical', 'debug'])
  })

  it('summarizes GitHub public events', () => {
    const summary = summarizeGithubEvents([
      { repo: { name: 'a/repo' }, type: 'PushEvent' },
      { repo: { name: 'a/repo' }, type: 'PullRequestEvent' },
      { repo: { name: 'b/repo' }, type: 'PushEvent' },
    ])

    expect(summary).toEqual({
      byType: { PullRequestEvent: 1, PushEvent: 2 },
      repoCount: 2,
    })
  })

  it('filters and sorts GitHub repositories by public metadata', () => {
    const repos: GithubRepo[] = [
      {
        description: 'React app',
        forks_count: 3,
        html_url: 'https://github.com/example/a',
        id: 1,
        language: 'TypeScript',
        name: 'alpha',
        stargazers_count: 4,
        updated_at: '2026-05-01T00:00:00Z',
      },
      {
        description: 'CLI',
        forks_count: 1,
        html_url: 'https://github.com/example/b',
        id: 2,
        language: 'Go',
        name: 'bravo',
        stargazers_count: 20,
        updated_at: '2026-04-01T00:00:00Z',
      },
      {
        description: 'Types',
        forks_count: 2,
        html_url: 'https://github.com/example/c',
        id: 3,
        language: 'TypeScript',
        name: 'charlie',
        stargazers_count: 7,
        updated_at: '2026-06-01T00:00:00Z',
      },
    ]
    const filters: GithubRepoFilters = { language: 'TypeScript', query: 'react', sort: 'stars' }

    expect(filterAndSortGithubRepos(repos, filters, 'No language').map((repo) => repo.name)).toEqual([
      'alpha',
    ])
    expect(filterAndSortGithubRepos(repos, { language: 'all', query: '', sort: 'recent' }, 'No language')[0].name).toBe(
      'charlie',
    )
  })
})
