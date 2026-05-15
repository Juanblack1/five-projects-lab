import { useEffect, useMemo, useState } from 'react'
import type { Language } from '../../hooks/useLanguagePreference'
import { calculateBudget, initialTransactions, type Transaction } from '../../suiteData'
import { createId } from '../../utils/ids'
import {
  buildMonthlyFinanceTrend,
  createDefaultTransactionDraft,
  defaultCategoryLimit,
  defaultSavingsGoal,
  filterTransactions,
  getBudgetCategoryOptions,
  getDefaultBudgetFilters,
  getTransactionMonthOptions,
  normalizeTransaction,
  type BudgetFieldErrors,
  type BudgetFilters,
} from './budgetModel'

type BudgetCopy = {
  amountInvalid: string
  categoryRequired: string
  dateRequired: string
  invalid: string
  labelRequired: string
}

type StoredBudgetState = {
  budgetFilters?: BudgetFilters
  categoryLimit?: string
  savingsGoal?: string
  transactions?: Transaction[]
}

const budgetStorageKey = 'five-projects-budget-v2'

function readStoredBudgetState(): StoredBudgetState {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(budgetStorageKey)
    return raw ? (JSON.parse(raw) as StoredBudgetState) : {}
  } catch {
    return {}
  }
}

function validateTransactionDraft(
  draft: ReturnType<typeof createDefaultTransactionDraft>,
  tBudget: BudgetCopy,
) {
  const errors: BudgetFieldErrors = {}
  const amount = Number(draft.amount)

  if (!draft.label.trim()) errors.label = tBudget.labelRequired
  if (!draft.category.trim()) errors.category = tBudget.categoryRequired
  if (!draft.date) errors.date = tBudget.dateRequired
  if (Number.isNaN(amount) || amount <= 0) errors.amount = tBudget.amountInvalid

  return errors
}

export function useBudgetModule(language: Language, tBudget: BudgetCopy, locale: string) {
  const storedState = readStoredBudgetState()
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    (storedState.transactions?.length ? storedState.transactions : initialTransactions).map(normalizeTransaction),
  )
  const [budgetError, setBudgetError] = useState('')
  const [budgetFieldErrors, setBudgetFieldErrors] = useState<BudgetFieldErrors>({})
  const [budgetFilters, setBudgetFilters] = useState<BudgetFilters>(
    storedState.budgetFilters ?? getDefaultBudgetFilters(),
  )
  const [categoryLimit, setCategoryLimit] = useState(storedState.categoryLimit ?? defaultCategoryLimit)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [savingsGoal, setSavingsGoal] = useState(storedState.savingsGoal ?? defaultSavingsGoal)
  const [transactionDraft, setTransactionDraft] = useState(() => createDefaultTransactionDraft(language))

  const categoryOptions = useMemo(() => {
    const categories = new Set([...getBudgetCategoryOptions(language), ...transactions.map((item) => item.category)])
    return Array.from(categories).sort((a, b) => a.localeCompare(b))
  }, [language, transactions])
  const monthOptions = useMemo(() => {
    const options = getTransactionMonthOptions(transactions)
    return options.includes(budgetFilters.month) || budgetFilters.month === 'all'
      ? options
      : [budgetFilters.month, ...options]
  }, [budgetFilters.month, transactions])
  const filteredTransactions = useMemo(
    () =>
      filterTransactions(transactions, budgetFilters).sort((a, b) => {
        const dateSort = b.date.localeCompare(a.date)
        return dateSort || b.id.localeCompare(a.id)
      }),
    [budgetFilters, transactions],
  )
  const budget = calculateBudget(filteredTransactions)
  const savingsGoalValue = Math.max(0, Number(savingsGoal) || 0)
  const categoryLimitValue = Math.max(0, Number(categoryLimit) || 0)
  const categoryEntries = Object.entries(budget.byCategory).sort((a, b) => b[1] - a[1])
  const topExpense = Math.max(1, categoryEntries[0]?.[1] ?? budget.largestExpense?.amount ?? 1)
  const topCategory = categoryEntries[0]
  const limitOverage =
    categoryLimitValue > 0 && topCategory ? Math.max(0, topCategory[1] - categoryLimitValue) : 0
  const savingsRate = budget.income > 0 ? Math.round((budget.balance / budget.income) * 100) : 0
  const goalProgress =
    savingsGoalValue > 0 ? Math.max(0, Math.min(100, Math.round((budget.balance / savingsGoalValue) * 100))) : 0
  const remainingGoal = Math.max(0, savingsGoalValue - budget.balance)
  const monthlyTrend = useMemo(
    () => buildMonthlyFinanceTrend(transactions, locale),
    [locale, transactions],
  )

  useEffect(() => {
    window.localStorage.setItem(
      budgetStorageKey,
      JSON.stringify({
        budgetFilters,
        categoryLimit,
        savingsGoal,
        transactions,
      }),
    )
  }, [budgetFilters, categoryLimit, savingsGoal, transactions])

  function resetTransactionDraft() {
    setEditingTransactionId(null)
    setTransactionDraft(createDefaultTransactionDraft(language))
    setBudgetError('')
    setBudgetFieldErrors({})
  }

  function saveTransaction() {
    const errors = validateTransactionDraft(transactionDraft, tBudget)
    setBudgetFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setBudgetError(tBudget.invalid)
      return
    }

    const normalizedAmount = Math.round(Number(transactionDraft.amount) * 100) / 100
    const nextTransaction: Transaction = {
      amount: normalizedAmount,
      category: transactionDraft.category.trim(),
      date: transactionDraft.date,
      id: editingTransactionId ?? createId('transaction'),
      label: transactionDraft.label.trim(),
      type: transactionDraft.type,
    }

    setTransactions((current) =>
      editingTransactionId
        ? current.map((item) => (item.id === editingTransactionId ? nextTransaction : item))
        : [nextTransaction, ...current],
    )
    setBudgetError('')
    setBudgetFieldErrors({})
    setEditingTransactionId(null)
    setTransactionDraft({
      ...createDefaultTransactionDraft(language),
      category: transactionDraft.category.trim(),
      type: transactionDraft.type,
    })
  }

  function editTransaction(transaction: Transaction) {
    setEditingTransactionId(transaction.id)
    setTransactionDraft({
      amount: String(transaction.amount),
      category: transaction.category,
      date: transaction.date,
      label: transaction.label,
      type: transaction.type,
    })
    setBudgetError('')
    setBudgetFieldErrors({})
  }

  function deleteTransaction(id: string) {
    setTransactions((current) => current.filter((item) => item.id !== id))
    if (editingTransactionId === id) {
      resetTransactionDraft()
    }
  }

  function clearBudgetFilters() {
    setBudgetFilters(getDefaultBudgetFilters())
  }

  return {
    budget,
    budgetError,
    budgetFieldErrors,
    budgetFilters,
    categoryEntries,
    categoryLimit,
    categoryOptions,
    clearBudgetFilters,
    deleteTransaction,
    editTransaction,
    editingTransactionId,
    filteredTransactions,
    goalProgress,
    limitOverage,
    monthOptions,
    monthlyTrend,
    remainingGoal,
    resetTransactionDraft,
    savingsGoal,
    savingsRate,
    saveTransaction,
    setBudgetFilters,
    setCategoryLimit,
    setSavingsGoal,
    setTransactionDraft,
    setTransactions,
    topExpense,
    transactionDraft,
    transactions,
  }
}
