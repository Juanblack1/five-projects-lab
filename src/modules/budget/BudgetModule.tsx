import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import { formatCurrency, type Transaction } from '../../suiteData'
import type {
  BudgetFieldErrors,
  BudgetFilters,
  MonthlyFinancePoint,
  TransactionDraft,
} from './budgetModel'

type BudgetCopy = {
  addFirst: string
  addTransaction: string
  allCategories: string
  allMonths: string
  allTypes: string
  amount: string
  amountInvalid: string
  balance: string
  cancelEdit: string
  cashflow: string
  category: string
  categoryEmpty: string
  clearFilters: string
  date: string
  edit: string
  editing: string
  expense: string
  expenseBadge: string
  expenseMix: string
  filter: string
  filteredEmpty: string
  filteredEmptyBody: string
  filterPlaceholder: string
  filters: string
  formTitle: string
  goal: string
  goalProgress: string
  income: string
  incomeBadge: string
  incomeVsExpense: string
  label: string
  largestExpense: string
  limit: string
  limitStatus: string
  month: string
  monthlyEvolution: string
  noExpenseChart: string
  noTransactions: string
  noTransactionsBody: string
  overLimit: (value: string) => string
  recent: string
  remainingGoal: string
  runway: string
  saveTransaction: string
  savings: string
  topCategory: string
  transactionsCount: (count: number) => string
  type: string
  withinLimit: string
}

type CommonCopy = {
  add: string
  remove: string
}

type BudgetModuleProps = {
  budget: {
    balance: number
    byCategory: Record<string, number>
    expense: number
    income: number
    largestExpense: Transaction | null
    topExpenseCategory: { amount: number; category: string } | null
  }
  budgetError: string
  budgetFieldErrors: BudgetFieldErrors
  budgetFilters: BudgetFilters
  categoryEntries: [string, number][]
  categoryLimit: string
  categoryOptions: string[]
  clearBudgetFilters: () => void
  currency: string
  deleteTransaction: (id: string) => void
  editTransaction: (transaction: Transaction) => void
  editingTransactionId: string | null
  filteredTransactions: Transaction[]
  goalProgress: number
  limitOverage: number
  locale: string
  monthOptions: string[]
  monthlyTrend: MonthlyFinancePoint[]
  remainingGoal: number
  resetTransactionDraft: () => void
  savingsGoal: string
  savingsRate: number
  saveTransaction: () => void
  setBudgetFilters: Dispatch<SetStateAction<BudgetFilters>>
  setCategoryLimit: (value: string) => void
  setSavingsGoal: (value: string) => void
  setTransactionDraft: Dispatch<SetStateAction<TransactionDraft>>
  tBudget: BudgetCopy
  tCommon: CommonCopy
  title: string
  topExpense: number
  transactionDraft: TransactionDraft
  transactions: Transaction[]
}

const budgetFilterTypes: BudgetFilters['type'][] = ['all', 'income', 'expense']

function getPercent(value: number, max: number) {
  return `${Math.max(4, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)))}%`
}

function formatMonthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  )
}

function formatTransactionDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(`${date}T00:00:00`))
}

export function BudgetModule({
  budget,
  budgetError,
  budgetFieldErrors,
  budgetFilters,
  categoryEntries,
  categoryLimit,
  categoryOptions,
  clearBudgetFilters,
  currency,
  deleteTransaction,
  editTransaction,
  editingTransactionId,
  filteredTransactions,
  goalProgress,
  limitOverage,
  locale,
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
  tBudget,
  tCommon,
  title,
  topExpense,
  transactionDraft,
  transactions,
}: BudgetModuleProps) {
  const comparisonMax = Math.max(budget.income, budget.expense, 1)
  const trendMax = Math.max(...monthlyTrend.flatMap((point) => [point.income, point.expense]), 1)
  const filteredEmpty = transactions.length > 0 && filteredTransactions.length === 0
  const topCategoryLabel = budget.topExpenseCategory
    ? `${budget.topExpenseCategory.category} · ${formatCurrency(budget.topExpenseCategory.amount, locale, currency)}`
    : tBudget.noExpenseChart

  return (
    <section className="panel budget-panel" aria-label={title}>
      <section className="finance-summary-grid" aria-label={tBudget.cashflow}>
        <article className="finance-balance-card">
          <span>{tBudget.balance}</span>
          <strong>{formatCurrency(budget.balance, locale, currency)}</strong>
          <p>
            {tBudget.transactionsCount(filteredTransactions.length)} · {tBudget.savings} {savingsRate}%
          </p>
        </article>
        <article>
          <span>{tBudget.income}</span>
          <strong>{formatCurrency(budget.income, locale, currency)}</strong>
        </article>
        <article>
          <span>{tBudget.expense}</span>
          <strong>{formatCurrency(budget.expense, locale, currency)}</strong>
        </article>
        <article>
          <span>{tBudget.largestExpense}</span>
          <strong>
            {budget.largestExpense ? formatCurrency(budget.largestExpense.amount, locale, currency) : '0'}
          </strong>
          <p>{budget.largestExpense?.label ?? tBudget.noExpenseChart}</p>
        </article>
        <article>
          <span>{tBudget.topCategory}</span>
          <strong>{budget.topExpenseCategory?.category ?? '-'}</strong>
          <p>{topCategoryLabel}</p>
        </article>
      </section>

      <section className="finance-planner-grid">
        <label className="field-card">
          <span>{tBudget.goal}</span>
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setSavingsGoal(event.target.value)}
            type="number"
            value={savingsGoal}
          />
        </label>
        <label className="field-card">
          <span>{tBudget.limit}</span>
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setCategoryLimit(event.target.value)}
            type="number"
            value={categoryLimit}
          />
        </label>
        <article className="module-card compact-card">
          <span>{tBudget.remainingGoal}</span>
          <strong>{formatCurrency(remainingGoal, locale, currency)}</strong>
        </article>
        <article className="module-card compact-card">
          <span>{tBudget.goalProgress}</span>
          <strong>{goalProgress}%</strong>
        </article>
      </section>

      <form
        className={`finance-form ${editingTransactionId ? 'is-editing' : ''}`}
        onSubmit={(event) => {
          event.preventDefault()
          saveTransaction()
        }}
      >
        <div className="card-title-row">
          <span>{editingTransactionId ? tBudget.editing : tBudget.formTitle}</span>
          {editingTransactionId && (
            <button onClick={resetTransactionDraft} type="button">
              {tBudget.cancelEdit}
            </button>
          )}
        </div>

        <div className="finance-type-toggle" role="group" aria-label={tBudget.type}>
          {(['income', 'expense'] as Transaction['type'][]).map((type) => (
            <button
              aria-pressed={transactionDraft.type === type}
              className={transactionDraft.type === type ? 'selected' : ''}
              key={type}
              onClick={() => setTransactionDraft((draft) => ({ ...draft, type }))}
              type="button"
            >
              {type === 'income' ? tBudget.incomeBadge : tBudget.expenseBadge}
            </button>
          ))}
        </div>

        <div className="finance-form-grid">
          <label>
            <span>{tBudget.label}</span>
            <input
              aria-describedby={budgetFieldErrors.label ? 'budget-label-error' : undefined}
              aria-invalid={Boolean(budgetFieldErrors.label)}
              onChange={(event) => setTransactionDraft((draft) => ({ ...draft, label: event.target.value }))}
              value={transactionDraft.label}
            />
            {budgetFieldErrors.label && (
              <em id="budget-label-error" role="alert">
                {budgetFieldErrors.label}
              </em>
            )}
          </label>
          <label>
            <span>{tBudget.amount}</span>
            <input
              aria-describedby={budgetFieldErrors.amount ? 'budget-amount-error' : undefined}
              aria-invalid={Boolean(budgetFieldErrors.amount)}
              inputMode="decimal"
              min="0"
              onChange={(event) => setTransactionDraft((draft) => ({ ...draft, amount: event.target.value }))}
              step="0.01"
              type="number"
              value={transactionDraft.amount}
            />
            {budgetFieldErrors.amount && (
              <em id="budget-amount-error" role="alert">
                {budgetFieldErrors.amount}
              </em>
            )}
          </label>
          <label>
            <span>{tBudget.category}</span>
            <input
              aria-describedby={budgetFieldErrors.category ? 'budget-category-error' : undefined}
              aria-invalid={Boolean(budgetFieldErrors.category)}
              list="budget-category-options"
              onChange={(event) => setTransactionDraft((draft) => ({ ...draft, category: event.target.value }))}
              value={transactionDraft.category}
            />
            <datalist id="budget-category-options">
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {budgetFieldErrors.category && (
              <em id="budget-category-error" role="alert">
                {budgetFieldErrors.category}
              </em>
            )}
          </label>
          <label>
            <span>{tBudget.date}</span>
            <input
              aria-describedby={budgetFieldErrors.date ? 'budget-date-error' : undefined}
              aria-invalid={Boolean(budgetFieldErrors.date)}
              onChange={(event) => setTransactionDraft((draft) => ({ ...draft, date: event.target.value }))}
              type="date"
              value={transactionDraft.date}
            />
            {budgetFieldErrors.date && (
              <em id="budget-date-error" role="alert">
                {budgetFieldErrors.date}
              </em>
            )}
          </label>
          <button className="primary-action" type="submit">
            {editingTransactionId ? tBudget.saveTransaction : tBudget.addTransaction}
          </button>
        </div>
        {budgetError && (
          <p className="error-line" role="alert">
            {budgetError}
          </p>
        )}
      </form>

      <section className="finance-filter-bar" aria-label={tBudget.filters}>
        <label>
          <span>{tBudget.filter}</span>
          <input
            onChange={(event) => setBudgetFilters((filters) => ({ ...filters, search: event.target.value }))}
            placeholder={tBudget.filterPlaceholder}
            value={budgetFilters.search}
          />
        </label>
        <label>
          <span>{tBudget.month}</span>
          <select
            onChange={(event) => setBudgetFilters((filters) => ({ ...filters, month: event.target.value }))}
            value={budgetFilters.month}
          >
            <option value="all">{tBudget.allMonths}</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{tBudget.category}</span>
          <select
            onChange={(event) => setBudgetFilters((filters) => ({ ...filters, category: event.target.value }))}
            value={budgetFilters.category}
          >
            <option value="all">{tBudget.allCategories}</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <div className="finance-filter-types" role="group" aria-label={tBudget.type}>
          {budgetFilterTypes.map((type) => (
            <button
              aria-pressed={budgetFilters.type === type}
              className={budgetFilters.type === type ? 'selected' : ''}
              key={type}
              onClick={() => setBudgetFilters((filters) => ({ ...filters, type }))}
              type="button"
            >
              {type === 'all' ? tBudget.allTypes : type === 'income' ? tBudget.income : tBudget.expense}
            </button>
          ))}
        </div>
        <button onClick={clearBudgetFilters} type="button">
          {tBudget.clearFilters}
        </button>
      </section>

      <section className="finance-grid">
        <div className="ledger finance-ledger" aria-label={tBudget.recent}>
          <div className="section-head">
            <h3>{tBudget.recent}</h3>
            <span>{tBudget.transactionsCount(filteredTransactions.length)}</span>
          </div>

          {transactions.length === 0 && (
            <article className="finance-empty-state">
              <strong>{tBudget.noTransactions}</strong>
              <p>{tBudget.noTransactionsBody}</p>
            </article>
          )}

          {filteredEmpty && (
            <article className="finance-empty-state">
              <strong>{tBudget.filteredEmpty}</strong>
              <p>{tBudget.filteredEmptyBody}</p>
              <button onClick={clearBudgetFilters} type="button">
                {tBudget.clearFilters}
              </button>
            </article>
          )}

          {filteredTransactions.map((transaction) => (
            <article
              className={editingTransactionId === transaction.id ? 'is-editing' : ''}
              key={transaction.id}
            >
              <time dateTime={transaction.date}>{formatTransactionDate(transaction.date, locale)}</time>
              <div>
                <strong>{transaction.label}</strong>
                <span>{transaction.category}</span>
              </div>
              <b className={transaction.type}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amount, locale, currency)}
              </b>
              <div className="ledger-actions">
                <button onClick={() => editTransaction(transaction)} type="button">
                  {tBudget.edit}
                </button>
                <button onClick={() => deleteTransaction(transaction.id)} type="button">
                  {tCommon.remove}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="finance-visuals">
          <section className="category-card finance-chart-card" aria-label={tBudget.incomeVsExpense}>
            <h3>{tBudget.incomeVsExpense}</h3>
            <div className="finance-comparison-row income">
              <p>
                <b>{tBudget.income}</b>
                <em>{formatCurrency(budget.income, locale, currency)}</em>
              </p>
              <i style={{ '--bar-size': getPercent(budget.income, comparisonMax) } as CSSProperties} />
            </div>
            <div className="finance-comparison-row expense">
              <p>
                <b>{tBudget.expense}</b>
                <em>{formatCurrency(budget.expense, locale, currency)}</em>
              </p>
              <i style={{ '--bar-size': getPercent(budget.expense, comparisonMax) } as CSSProperties} />
            </div>
            <div className="limit-summary">
              <span>{tBudget.limitStatus}</span>
              <strong>
                {limitOverage > 0
                  ? tBudget.overLimit(formatCurrency(limitOverage, locale, currency))
                  : tBudget.withinLimit}
              </strong>
            </div>
          </section>

          <section className="category-card finance-chart-card" aria-label={tBudget.expenseMix}>
            <h3>{tBudget.expenseMix}</h3>
            {categoryEntries.length === 0 && <p>{tBudget.categoryEmpty}</p>}
            {categoryEntries.map(([category, amount]) => (
              <div key={category}>
                <p>
                  <b>{category}</b>
                  <em>{formatCurrency(amount, locale, currency)}</em>
                </p>
                <i style={{ '--bar-size': getPercent(amount, topExpense) } as CSSProperties} />
              </div>
            ))}
          </section>

          <section className="category-card finance-chart-card" aria-label={tBudget.monthlyEvolution}>
            <h3>{tBudget.monthlyEvolution}</h3>
            <div className="monthly-chart">
              {monthlyTrend.map((point) => (
                <div key={point.key}>
                  <div>
                    <i
                      className="income"
                      style={{ '--bar-size': getPercent(point.income, trendMax) } as CSSProperties}
                    />
                    <i
                      className="expense"
                      style={{ '--bar-size': getPercent(point.expense, trendMax) } as CSSProperties}
                    />
                  </div>
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  )
}
