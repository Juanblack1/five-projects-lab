import { describe, expect, it } from 'vitest'
import {
  calculateBudget,
  parseCsv,
  summarizeGithubEvents,
  summarizeLogs,
  type Transaction,
} from './suiteData'

describe('suite helpers', () => {
  it('calculates income, expenses, balance and categories', () => {
    const transactions: Transaction[] = [
      { amount: 1000, category: 'Income', id: '1', label: 'Job', type: 'income' },
      { amount: 200, category: 'Tools', id: '2', label: 'IDE', type: 'expense' },
      { amount: 50, category: 'Tools', id: '3', label: 'API', type: 'expense' },
    ]

    expect(calculateBudget(transactions)).toMatchObject({
      balance: 750,
      byCategory: { Tools: 250 },
      expense: 250,
      income: 1000,
    })
  })

  it('cleans duplicated CSV rows and counts missing cells', () => {
    const result = parseCsv('name,status\nAna,done\nBob,\nAna,done')

    expect(result.rows).toBe(2)
    expect(result.duplicates).toBe(1)
    expect(result.missing).toBe(1)
  })

  it('summarizes logs by severity', () => {
    const result = summarizeLogs('[INFO] ok\n[ERROR] broken\n[WARN] slow', new Date('2026-05-14T12:00:00Z'))

    expect(result.counts).toEqual({ debug: 0, error: 1, info: 1, warn: 1 })
    expect(result.archiveName).toBe('logs-2026-05-14T12-00-00.zip')
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
})
