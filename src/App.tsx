import { useEffect, useState, type CSSProperties } from 'react'
import './App.css'
import {
  calculateBudget,
  formatCurrency,
  initialTransactions,
  parseCsv,
  sampleCsv,
  sampleLogs,
  suiteProjects,
  summarizeGithubEvents,
  summarizeLogs,
  type ProjectKey,
  type Transaction,
} from './suiteData'

type GithubEvent = {
  id: string
  type: string
  repo?: { name: string }
  created_at: string
}

type GithubProfile = {
  avatar_url?: string
  bio?: string
  followers?: number
  html_url?: string
  login: string
  name?: string
  public_repos?: number
}

type FocusTask = {
  id: string
  done: boolean
  label: string
}

type LogSeverity = 'all' | 'debug' | 'error' | 'info' | 'warn'

const timerModes = {
  break: 5 * 60,
  focus: 25 * 60,
}

const initialFocusTasks: FocusTask[] = [
  { done: false, id: 'f-1', label: 'Pick one concrete deliverable' },
  { done: false, id: 'f-2', label: 'Close chat and noisy tabs' },
  { done: false, id: 'f-3', label: 'Write a 2-line completion note' },
]

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

function getSeverity(line: string): Exclude<LogSeverity, 'all'> {
  const normalized = line.toLowerCase()
  if (normalized.includes('error')) return 'error'
  if (normalized.includes('warn')) return 'warn'
  if (normalized.includes('debug')) return 'debug'
  return 'info'
}

function App() {
  const author = import.meta.env.VITE_PUBLIC_AUTHOR || 'Portfolio Builder'
  const portfolioUrl = import.meta.env.VITE_PUBLIC_PORTFOLIO_URL || '#'
  const [activeProject, setActiveProject] = useState<ProjectKey>('focus')
  const [timerMode, setTimerMode] = useState<'break' | 'focus'>('focus')
  const [secondsLeft, setSecondsLeft] = useState(timerModes.focus)
  const [timerRunning, setTimerRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [focusIntent, setFocusIntent] = useState('Ship one visible improvement')
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>(initialFocusTasks)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [budgetError, setBudgetError] = useState('')
  const [transactionDraft, setTransactionDraft] = useState({
    amount: '240',
    category: 'Learning',
    label: 'Course subscription',
    type: 'expense' as Transaction['type'],
  })
  const [githubUser, setGithubUser] = useState('Juanblack1')
  const [githubEvents, setGithubEvents] = useState<GithubEvent[]>([])
  const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null)
  const [githubStatus, setGithubStatus] = useState('Ready to fetch public events.')
  const [csvInput, setCsvInput] = useState(sampleCsv)
  const [copyStatus, setCopyStatus] = useState('')
  const [logInput, setLogInput] = useState(sampleLogs)
  const [logSeverity, setLogSeverity] = useState<LogSeverity>('all')
  const [archiveDate] = useState(() => new Date())

  useEffect(() => {
    if (!timerRunning) return

    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setTimerRunning(false)
          if (timerMode === 'focus') {
            setCompletedSessions((count) => count + 1)
          }
          return 0
        }

        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [timerRunning, timerMode])

  const selectedProject =
    suiteProjects.find((project) => project.key === activeProject) ?? suiteProjects[0]
  const activeStyle = { '--accent': selectedProject.accent } as CSSProperties
  const budget = calculateBudget(transactions)
  const csvReport = parseCsv(csvInput)
  const csvRows = csvReport.cleaned
    ? csvReport.cleaned.split('\n').map((row) => row.split(','))
    : []
  const csvHeaders = csvRows[0] ?? []
  const csvBody = csvRows.slice(1, 6)
  const csvQuality = Math.max(
    0,
    Math.min(100, 100 - csvReport.duplicates * 14 - csvReport.missing * 9),
  )
  const logReport = summarizeLogs(logInput, archiveDate)
  const githubReport = summarizeGithubEvents(githubEvents)
  const timerProgress = Math.round(
    ((timerModes[timerMode] - secondsLeft) / timerModes[timerMode]) * 100,
  )
  const taskProgress = Math.round(
    (focusTasks.filter((task) => task.done).length / focusTasks.length) * 100,
  )
  const categoryEntries = Object.entries(budget.byCategory).sort((a, b) => b[1] - a[1])
  const topExpense = categoryEntries[0]?.[1] ?? 1
  const savingsRate = budget.income > 0 ? Math.round((budget.balance / budget.income) * 100) : 0
  const logEntries = logInput
    .split(/\r?\n/)
    .map((line, index) => ({ id: `${index}-${line}`, line, severity: getSeverity(line) }))
    .filter((entry) => entry.line.trim().length > 0)
  const visibleLogs =
    logSeverity === 'all'
      ? logEntries
      : logEntries.filter((entry) => entry.severity === logSeverity)

  function changeTimerMode(mode: 'break' | 'focus') {
    setTimerMode(mode)
    setSecondsLeft(timerModes[mode])
    setTimerRunning(false)
  }

  function addTransaction() {
    const amount = Number(transactionDraft.amount)
    if (
      !transactionDraft.label.trim() ||
      !transactionDraft.category.trim() ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      setBudgetError('Fill label, category and a positive amount.')
      return
    }

    setTransactions((current) => [
      {
        amount,
        category: transactionDraft.category.trim(),
        id: crypto.randomUUID(),
        label: transactionDraft.label.trim(),
        type: transactionDraft.type,
      },
      ...current,
    ])
    setBudgetError('')
    setTransactionDraft({ ...transactionDraft, amount: '', label: '' })
  }

  async function fetchGithubEvents() {
    const username = githubUser.trim()
    if (!username) {
      setGithubStatus('Type a GitHub username first.')
      return
    }

    setGithubStatus('Fetching public activity...')
    try {
      const [profileResponse, eventsResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
        fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=8`,
        ),
      ])

      if (!profileResponse.ok) {
        throw new Error(`GitHub profile returned ${profileResponse.status}`)
      }

      if (!eventsResponse.ok) {
        throw new Error(`GitHub events returned ${eventsResponse.status}`)
      }

      const profile = (await profileResponse.json()) as GithubProfile
      const events = (await eventsResponse.json()) as GithubEvent[]
      setGithubProfile(profile)
      setGithubEvents(events)
      setGithubStatus(events.length ? `Loaded ${events.length} public events.` : 'No public events found.')
    } catch (error) {
      setGithubEvents([])
      setGithubProfile(null)
      setGithubStatus(error instanceof Error ? error.message : 'Could not fetch GitHub events.')
    }
  }

  async function copyCleanCsv() {
    try {
      await navigator.clipboard.writeText(csvReport.cleaned)
      setCopyStatus('Cleaned CSV copied.')
    } catch {
      setCopyStatus('Copy blocked by browser permissions.')
    }
  }

  return (
    <main className="app-shell" style={activeStyle}>
      <aside className="sidebar">
        <div className="brand-card">
          <span>Software factory</span>
          <strong>Five Labs</strong>
          <p>5 private portfolio mini-products with real interaction.</p>
        </div>

        <nav className="project-rail" aria-label="Choose a project">
          {suiteProjects.map((project, index) => (
            <button
              className={project.key === activeProject ? 'active' : ''}
              key={project.key}
              onClick={() => setActiveProject(project.key)}
              style={{ '--accent': project.accent } as CSSProperties}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{project.title}</strong>
              <small>{project.kicker}</small>
            </button>
          ))}
        </nav>

        <div className="safe-card">
          <strong>No secrets</strong>
          <span>.env ignored</span>
          <span>VITE_* is public</span>
        </div>
      </aside>

      <section className="stage">
        <header className="stage-hero">
          <div>
            <p className="eyebrow">GitHub portfolio suite</p>
            <h1>Five products that look like apps, not exercises.</h1>
            <p>
              One responsive lab with productivity, finance, public API, data cleaning and log analysis workflows.
            </p>
          </div>
          <div className="hero-metrics" aria-label="Suite metrics">
            <article><strong>5</strong><span>apps</span></article>
            <article><strong>0</strong><span>secrets</span></article>
            <article><strong>4</strong><span>tests</span></article>
          </div>
        </header>

        <section className="workbench">
          <aside className="project-brief">
            <p className="eyebrow">Current module</p>
            <h2>{selectedProject.title}</h2>
            <p>{selectedProject.summary}</p>
            <div className="chips">
              {selectedProject.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </aside>

          {activeProject === 'focus' && (
            <section className="panel focus-panel">
              <div className="timer-card">
                <div>
                  <span>{timerMode === 'focus' ? 'Deep work sprint' : 'Recovery window'}</span>
                  <strong>{formatTimer(secondsLeft)}</strong>
                </div>
                <div className="progress"><i style={{ width: `${timerProgress}%` }}></i></div>
                <div className="button-row">
                  <button onClick={() => setTimerRunning((value) => !value)} type="button">
                    {timerRunning ? 'Pause timer' : 'Start timer'}
                  </button>
                  <button onClick={() => changeTimerMode('focus')} type="button">25 min focus</button>
                  <button onClick={() => changeTimerMode('break')} type="button">5 min break</button>
                  <button onClick={() => setSecondsLeft(timerModes[timerMode])} type="button">Reset</button>
                </div>
              </div>
              <div className="side-grid">
                <article className="module-card">
                  <span>Intent</span>
                  <input aria-label="Focus intent" onChange={(event) => setFocusIntent(event.target.value)} value={focusIntent} />
                </article>
                <article className="module-card">
                  <span>Sessions done</span>
                  <strong>{completedSessions}</strong>
                  <button onClick={() => setCompletedSessions(0)} type="button">Clear</button>
                </article>
                <article className="module-card task-card">
                  <span>Launch checklist</span>
                  <b>{taskProgress}% ready</b>
                  {focusTasks.map((task) => (
                    <label key={task.id}>
                      <input
                        checked={task.done}
                        onChange={() =>
                          setFocusTasks((current) =>
                            current.map((item) =>
                              item.id === task.id ? { ...item, done: !item.done } : item,
                            ),
                          )
                        }
                        type="checkbox"
                      />
                      {task.label}
                    </label>
                  ))}
                </article>
              </div>
            </section>
          )}

          {activeProject === 'budget' && (
            <section className="panel budget-panel">
              <div className="metric-grid">
                <article><span>Income</span><strong>{formatCurrency(budget.income)}</strong></article>
                <article><span>Expense</span><strong>{formatCurrency(budget.expense)}</strong></article>
                <article><span>Savings</span><strong>{savingsRate}%</strong></article>
              </div>
              <div className="form-grid">
                <input aria-label="Transaction label" onChange={(event) => setTransactionDraft({ ...transactionDraft, label: event.target.value })} placeholder="Label" value={transactionDraft.label} />
                <input aria-label="Transaction amount" onChange={(event) => setTransactionDraft({ ...transactionDraft, amount: event.target.value })} placeholder="Amount" type="number" value={transactionDraft.amount} />
                <input aria-label="Transaction category" onChange={(event) => setTransactionDraft({ ...transactionDraft, category: event.target.value })} placeholder="Category" value={transactionDraft.category} />
                <select aria-label="Transaction type" onChange={(event) => setTransactionDraft({ ...transactionDraft, type: event.target.value as Transaction['type'] })} value={transactionDraft.type}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <button onClick={addTransaction} type="button">Add</button>
              </div>
              {budgetError && <p className="error-line">{budgetError}</p>}
              <div className="budget-grid">
                <section className="ledger">
                  {transactions.map((transaction) => (
                    <article key={transaction.id}>
                      <div><strong>{transaction.label}</strong><span>{transaction.category}</span></div>
                      <b>{transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}</b>
                      <button onClick={() => setTransactions((current) => current.filter((item) => item.id !== transaction.id))} type="button">Remove</button>
                    </article>
                  ))}
                </section>
                <section className="category-card">
                  <span>Expense mix</span>
                  {categoryEntries.length === 0 && <p>No expenses yet.</p>}
                  {categoryEntries.map(([category, amount]) => (
                    <div key={category}>
                      <p><b>{category}</b><em>{formatCurrency(amount)}</em></p>
                      <i style={{ width: `${Math.round((amount / topExpense) * 100)}%` }}></i>
                    </div>
                  ))}
                </section>
              </div>
            </section>
          )}

          {activeProject === 'github' && (
            <section className="panel github-panel">
              <div className="search-row">
                <input aria-label="GitHub username" onChange={(event) => setGithubUser(event.target.value)} value={githubUser} />
                <button onClick={fetchGithubEvents} type="button">Analyze public profile</button>
              </div>
              <p className="status-line">{githubStatus}</p>
              <div className="github-grid">
                <article className="profile-card">
                  {githubProfile?.avatar_url && <img alt="" src={githubProfile.avatar_url} />}
                  <div>
                    <span>Profile</span>
                    <strong>{githubProfile?.name || githubProfile?.login || githubUser}</strong>
                    <p>{githubProfile?.bio || 'Fetch a user to load public bio, repositories and activity.'}</p>
                  </div>
                </article>
                <div className="metric-grid compact">
                  <article><span>Events</span><strong>{githubEvents.length}</strong></article>
                  <article><span>Repos</span><strong>{githubProfile?.public_repos ?? githubReport.repoCount}</strong></article>
                  <article><span>Followers</span><strong>{githubProfile?.followers ?? 0}</strong></article>
                </div>
              </div>
              <div className="event-list">
                {githubEvents.map((event) => (
                  <article key={event.id}>
                    <strong>{event.type.replace('Event', '')}</strong>
                    <span>{event.repo?.name ?? 'Unknown repo'}</span>
                    <time>{new Date(event.created_at).toLocaleString()}</time>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeProject === 'csv' && (
            <section className="panel data-panel">
              <div className="editor-grid">
                <label>Raw CSV<textarea aria-label="CSV input" onChange={(event) => setCsvInput(event.target.value)} value={csvInput} /></label>
                <div className="quality-card">
                  <span>Quality score</span>
                  <strong>{csvQuality}</strong>
                  <p>{csvReport.rows} clean rows, {csvReport.duplicates} duplicate removed, {csvReport.missing} missing cells.</p>
                  <button onClick={copyCleanCsv} type="button">Copy cleaned CSV</button>
                  {copyStatus && <em>{copyStatus}</em>}
                </div>
              </div>
              <div className="table-card">
                <table>
                  <thead><tr>{csvHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                  <tbody>
                    {csvBody.map((row, rowIndex) => (
                      <tr key={`${row.join('-')}-${rowIndex}`}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{cell || 'missing'}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="output-box">Cleaned CSV<textarea readOnly value={csvReport.cleaned} /></label>
            </section>
          )}

          {activeProject === 'logs' && (
            <section className="panel logs-panel">
              <div className="editor-grid">
                <label>Raw logs<textarea aria-label="Log input" onChange={(event) => setLogInput(event.target.value)} value={logInput} /></label>
                <div className="quality-card danger">
                  <span>Operational risk</span>
                  <strong>{logReport.counts.error > 0 ? 'High' : logReport.counts.warn > 0 ? 'Medium' : 'Low'}</strong>
                  <p>{logReport.counts.error} errors, {logReport.counts.warn} warnings, {logReport.lines} total lines.</p>
                  <b>{logReport.archiveName}</b>
                </div>
              </div>
              <div className="severity-tabs">
                {(['all', 'error', 'warn', 'info', 'debug'] as LogSeverity[]).map((severity) => (
                  <button className={logSeverity === severity ? 'active' : ''} key={severity} onClick={() => setLogSeverity(severity)} type="button">
                    {severity}
                  </button>
                ))}
              </div>
              <div className="log-list">
                {visibleLogs.map((entry) => (
                  <article className={entry.severity} key={entry.id}>
                    <span>{entry.severity}</span>
                    <code>{entry.line}</code>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>

        <footer>
          <span>Built for {author}</span>
          <a href={portfolioUrl}>Portfolio link</a>
        </footer>
      </section>
    </main>
  )
}

export default App
