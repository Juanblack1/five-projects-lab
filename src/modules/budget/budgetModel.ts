import type { Language } from '../../hooks/useLanguagePreference'
import type { Transaction } from '../../suiteData'

export type TransactionDraft = {
  amount: string
  category: string
  date: string
  label: string
  type: Transaction['type']
}

export type BudgetFilterType = Transaction['type'] | 'all'

export type BudgetFilters = {
  category: string
  month: string
  search: string
  type: BudgetFilterType
}

export type BudgetFieldErrors = Partial<Record<keyof TransactionDraft, string>>

export type MonthlyFinancePoint = {
  balance: number
  expense: number
  income: number
  key: string
  label: string
}

export const defaultCategoryLimit = '500'
export const defaultSavingsGoal = '1200'

export function getCurrentMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

export function getTodayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function createDefaultTransactionDraft(language: Language): TransactionDraft {
  return {
    amount: '240',
    category: language === 'pt-BR' ? 'Aprendizado' : 'Learning',
    date: getTodayDateKey(),
    label: language === 'pt-BR' ? 'Assinatura de curso' : 'Course subscription',
    type: 'expense' as Transaction['type'],
  }
}

export function getDefaultBudgetFilters(): BudgetFilters {
  return {
    category: 'all',
    month: 'all',
    search: '',
    type: 'all',
  }
}

export function getBudgetCategoryOptions(language: Language) {
  return language === 'pt-BR'
    ? ['Moradia', 'Mercado', 'Transporte', 'Saude', 'Educacao', 'Lazer', 'Ferramentas', 'Renda']
    : ['Housing', 'Groceries', 'Transport', 'Health', 'Education', 'Leisure', 'Tools', 'Income']
}

export function normalizeTransaction(raw: Transaction): Transaction {
  return {
    ...raw,
    amount: Math.max(0, Number(raw.amount) || 0),
    category: raw.category?.trim() || 'General',
    date: raw.date || getTodayDateKey(),
    label: raw.label?.trim() || 'Transaction',
    type: raw.type === 'income' ? 'income' : 'expense',
  }
}

export function filterTransactions(transactions: Transaction[], filters: BudgetFilters) {
  const search = filters.search.trim().toLowerCase()

  return transactions.filter((transaction) => {
    const matchesMonth = filters.month === 'all' || transaction.date.slice(0, 7) === filters.month
    const matchesCategory = filters.category === 'all' || transaction.category === filters.category
    const matchesType = filters.type === 'all' || transaction.type === filters.type
    const matchesSearch =
      search.length === 0 ||
      [transaction.label, transaction.category, transaction.type, transaction.date]
        .join(' ')
        .toLowerCase()
        .includes(search)

    return matchesMonth && matchesCategory && matchesType && matchesSearch
  })
}

export function getTransactionMonthOptions(transactions: Transaction[]) {
  return Array.from(new Set(transactions.map((transaction) => transaction.date.slice(0, 7)))).sort().reverse()
}

export function buildMonthlyFinanceTrend(
  transactions: Transaction[],
  locale: string,
  monthCount = 6,
  date = new Date(),
): MonthlyFinancePoint[] {
  const points: MonthlyFinancePoint[] = []
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' })

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const monthDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - index, 1))
    const key = monthDate.toISOString().slice(0, 7)
    const monthTransactions = transactions.filter((transaction) => transaction.date.slice(0, 7) === key)
    const income = monthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + Math.round(transaction.amount * 100), 0)
    const expense = monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + Math.round(transaction.amount * 100), 0)

    points.push({
      balance: (income - expense) / 100,
      expense: expense / 100,
      income: income / 100,
      key,
      label: formatter.format(monthDate),
    })
  }

  return points
}
