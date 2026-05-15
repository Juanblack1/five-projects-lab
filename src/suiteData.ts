export type ProjectKey = 'focus' | 'budget' | 'github' | 'csv' | 'logs'

export type SuiteProject = {
  key: ProjectKey
  title: string
  kicker: string
  summary: string
  accent: string
  skills: string[]
}

export type Transaction = {
  amount: number
  category: string
  date: string
  id: string
  label: string
  type: 'income' | 'expense'
}

export const suiteProjects: SuiteProject[] = [
  {
    key: 'focus',
    title: 'Focus Rhythm',
    kicker: 'Pomodoro cockpit',
    summary: 'Timer de foco com ciclos, progresso visual e comandos simples.',
    accent: '#8cff66',
    skills: ['timers', 'state', 'productivity UX'],
  },
  {
    key: 'budget',
    title: 'Money Compass',
    kicker: 'Finance tracker',
    summary: 'Controle de receitas e despesas com saldo, categorias e historico.',
    accent: '#ffd166',
    skills: ['forms', 'derived data', 'validation'],
  },
  {
    key: 'github',
    title: 'GitHub Radar',
    kicker: 'Public API lens',
    summary: 'Consulta atividade publica de um usuario no GitHub sem token.',
    accent: '#6bdcff',
    skills: ['fetch', 'API states', 'error handling'],
  },
  {
    key: 'csv',
    title: 'CSV Triage',
    kicker: 'Data cleaner',
    summary: 'Limpa CSV colado, detecta campos vazios e remove linhas duplicadas.',
    accent: '#caa8ff',
    skills: ['parsing', 'data quality', 'export'],
  },
  {
    key: 'logs',
    title: 'Log Sentinel',
    kicker: 'Ops analyzer',
    summary: 'Resume logs por severidade e gera um nome seguro de arquivo.',
    accent: '#ff7a90',
    skills: ['text processing', 'DevOps', 'summaries'],
  },
]

export const initialTransactions: Transaction[] = [
  {
    amount: 1800,
    category: 'Income',
    date: '2026-05-03',
    id: 't-1',
    label: 'Freelance landing page',
    type: 'income',
  },
  {
    amount: 120,
    category: 'Tools',
    date: '2026-05-07',
    id: 't-2',
    label: 'Cloud lab credits',
    type: 'expense',
  },
  {
    amount: 86,
    category: 'Creative',
    date: '2026-04-22',
    id: 't-3',
    label: 'Design assets',
    type: 'expense',
  },
]

export const sampleCsv = `name,track,status
Ana,Frontend,done
Bruno,Backend,
Ana,Frontend,done
Clara,Data,review`

export const sampleLogs = `[INFO] server started on port 4173
[WARN] cache miss for /api/projects
[ERROR] failed to sync optional analytics
[INFO] retry completed
[DEBUG] render cycle 42`

export function formatCurrency(value: number, locale = 'en-US', currency = 'USD') {
  return new Intl.NumberFormat(locale, {
    currency,
    style: 'currency',
  }).format(value)
}

function toCents(value: number) {
  return Math.round(value * 100)
}

function fromCents(value: number) {
  return value / 100
}

export function calculateBudget(transactions: Transaction[]) {
  const summary = transactions.reduce(
    (current, transaction) => {
      const amountInCents = toCents(transaction.amount)

      if (transaction.type === 'income') {
        current.income += amountInCents
      } else {
        current.expense += amountInCents
        current.byCategory[transaction.category] =
          (current.byCategory[transaction.category] ?? 0) + amountInCents

        if (!current.largestExpense || transaction.amount > current.largestExpense.amount) {
          current.largestExpense = transaction
        }
      }

      current.balance = current.income - current.expense
      return current
    },
    {
      balance: 0,
      byCategory: {} as Record<string, number>,
      expense: 0,
      income: 0,
      largestExpense: null as Transaction | null,
    },
  )

  const byCategory = Object.fromEntries(
    Object.entries(summary.byCategory).map(([category, amount]) => [category, fromCents(amount)]),
  )
  const topExpenseCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  return {
    balance: fromCents(summary.balance),
    byCategory,
    expense: fromCents(summary.expense),
    income: fromCents(summary.income),
    largestExpense: summary.largestExpense,
    topExpenseCategory: topExpenseCategory
      ? { amount: topExpenseCategory[1], category: topExpenseCategory[0] }
      : null,
  }
}

export function parseCsv(input: string) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { cleaned: '', duplicates: 0, headers: [] as string[], missing: 0, rows: 0 }
  }

  const headers = lines[0].split(',').map((cell) => cell.trim())
  const seen = new Set<string>()
  let duplicates = 0
  let missing = 0
  const cleanedRows: string[][] = []

  for (const line of lines.slice(1)) {
    const cells = line.split(',').map((cell) => cell.trim())
    while (cells.length < headers.length) {
      cells.push('')
    }
    missing += cells.slice(0, headers.length).filter((cell) => cell.length === 0).length
    const key = cells.join('|').toLowerCase()
    if (seen.has(key)) {
      duplicates += 1
      continue
    }
    seen.add(key)
    cleanedRows.push(cells)
  }

  const cleaned = [headers, ...cleanedRows].map((row) => row.join(',')).join('\n')

  return { cleaned, duplicates, headers, missing, rows: cleanedRows.length }
}

export function summarizeLogs(input: string, date = new Date()) {
  const counts = { debug: 0, error: 0, info: 0, warn: 0 }
  const lines = input.split(/\r?\n/).filter((line) => line.trim().length > 0)

  for (const line of lines) {
    const normalized = line.toLowerCase()
    if (normalized.includes('error')) counts.error += 1
    else if (normalized.includes('warn')) counts.warn += 1
    else if (normalized.includes('debug')) counts.debug += 1
    else counts.info += 1
  }

  const stamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return {
    archiveName: `logs-${stamp}.zip`,
    counts,
    lines: lines.length,
  }
}

export function summarizeGithubEvents(events: { type: string; repo?: { name: string } }[]) {
  const byType: Record<string, number> = {}
  const repos = new Set<string>()

  for (const event of events) {
    byType[event.type] = (byType[event.type] ?? 0) + 1
    if (event.repo?.name) {
      repos.add(event.repo.name)
    }
  }

  return { byType, repoCount: repos.size }
}
