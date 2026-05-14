import { useEffect, useState } from 'react'
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

const timerModes = {
  break: 5 * 60,
  focus: 25 * 60,
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

function App() {
  const author = import.meta.env.VITE_PUBLIC_AUTHOR || 'Portfolio Builder'
  const portfolioUrl = import.meta.env.VITE_PUBLIC_PORTFOLIO_URL || '#'
  const [activeProject, setActiveProject] = useState<ProjectKey>('focus')
  const [timerMode, setTimerMode] = useState<'break' | 'focus'>('focus')
  const [secondsLeft, setSecondsLeft] = useState(timerModes.focus)
  const [timerRunning, setTimerRunning] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [transactionDraft, setTransactionDraft] = useState({
    amount: '240',
    category: 'Learning',
    label: 'Course subscription',
    type: 'expense' as Transaction['type'],
  })
  const [githubUser, setGithubUser] = useState('Juanblack1')
  const [githubEvents, setGithubEvents] = useState<GithubEvent[]>([])
  const [githubStatus, setGithubStatus] = useState('Ready to fetch public events.')
  const [csvInput, setCsvInput] = useState(sampleCsv)
  const [logInput, setLogInput] = useState(sampleLogs)
  const [archiveDate] = useState(() => new Date())

  useEffect(() => {
    if (!timerRunning) return

    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setTimerRunning(false)
          return 0
        }

        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [timerRunning])

  const selectedProject = suiteProjects.find((project) => project.key === activeProject) ?? suiteProjects[0]
  const budget = calculateBudget(transactions)
  const csvReport = parseCsv(csvInput)
  const logReport = summarizeLogs(logInput, archiveDate)
  const githubReport = summarizeGithubEvents(githubEvents)
  const timerProgress = Math.round(
    ((timerModes[timerMode] - secondsLeft) / timerModes[timerMode]) * 100,
  )

  function changeTimerMode(mode: 'break' | 'focus') {
    setTimerMode(mode)
    setSecondsLeft(timerModes[mode])
    setTimerRunning(false)
  }

  function addTransaction() {
    const amount = Number(transactionDraft.amount)
    if (!transactionDraft.label.trim() || !transactionDraft.category.trim() || Number.isNaN(amount) || amount <= 0) {
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
  }

  async function fetchGithubEvents() {
    const username = githubUser.trim()
    if (!username) {
      setGithubStatus('Type a GitHub username first.')
      return
    }

    setGithubStatus('Fetching public activity...')
    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=8`,
      )

      if (!response.ok) {
        throw new Error(`GitHub returned ${response.status}`)
      }

      const data = (await response.json()) as GithubEvent[]
      setGithubEvents(data)
      setGithubStatus(data.length ? `Loaded ${data.length} public events.` : 'No public events found.')
    } catch (error) {
      setGithubEvents([])
      setGithubStatus(error instanceof Error ? error.message : 'Could not fetch GitHub events.')
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Software factory delivery</p>
          <h1>Five polished mini-products for a GitHub portfolio.</h1>
          <p className="hero-copy">
            Five working projects in one private lab: productivity, finance, public API, data cleaning, and DevOps text analysis.
          </p>
        </div>
        <div className="hero-score">
          <span>5</span>
          <strong>apps ready</strong>
          <p>No secret required. Browser-safe by default.</p>
        </div>
      </section>

      <section className="project-tabs" aria-label="Choose a project">
        {suiteProjects.map((project) => (
          <button
            className={project.key === activeProject ? 'active' : ''}
            key={project.key}
            onClick={() => setActiveProject(project.key)}
            style={{ '--accent': project.accent } as React.CSSProperties}
            type="button"
          >
            <span>{project.kicker}</span>
            <strong>{project.title}</strong>
          </button>
        ))}
      </section>

      <section className="workbench" style={{ '--accent': selectedProject.accent } as React.CSSProperties}>
        <aside className="project-brief">
          <p className="eyebrow">Current project</p>
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
            <div className="timer-face">
              <span>{timerMode === 'focus' ? 'Deep work' : 'Recovery'}</span>
              <strong>{formatTimer(secondsLeft)}</strong>
              <div className="progress"><i style={{ width: `${timerProgress}%` }}></i></div>
            </div>
            <div className="button-row">
              <button onClick={() => setTimerRunning((value) => !value)} type="button">
                {timerRunning ? 'Pause' : 'Start'}
              </button>
              <button onClick={() => changeTimerMode('focus')} type="button">Focus</button>
              <button onClick={() => changeTimerMode('break')} type="button">Break</button>
              <button onClick={() => setSecondsLeft(timerModes[timerMode])} type="button">Reset</button>
            </div>
          </section>
        )}

        {activeProject === 'budget' && (
          <section className="panel budget-panel">
            <div className="metric-grid">
              <article><span>Income</span><strong>{formatCurrency(budget.income)}</strong></article>
              <article><span>Expense</span><strong>{formatCurrency(budget.expense)}</strong></article>
              <article><span>Balance</span><strong>{formatCurrency(budget.balance)}</strong></article>
            </div>
            <div className="form-grid">
              <input aria-label="Transaction label" onChange={(event) => setTransactionDraft({ ...transactionDraft, label: event.target.value })} value={transactionDraft.label} />
              <input aria-label="Transaction amount" onChange={(event) => setTransactionDraft({ ...transactionDraft, amount: event.target.value })} type="number" value={transactionDraft.amount} />
              <input aria-label="Transaction category" onChange={(event) => setTransactionDraft({ ...transactionDraft, category: event.target.value })} value={transactionDraft.category} />
              <select aria-label="Transaction type" onChange={(event) => setTransactionDraft({ ...transactionDraft, type: event.target.value as Transaction['type'] })} value={transactionDraft.type}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <button onClick={addTransaction} type="button">Add transaction</button>
            </div>
            <div className="ledger">
              {transactions.map((transaction) => (
                <article key={transaction.id}>
                  <div><strong>{transaction.label}</strong><span>{transaction.category}</span></div>
                  <b>{transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}</b>
                  <button onClick={() => setTransactions((current) => current.filter((item) => item.id !== transaction.id))} type="button">Remove</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeProject === 'github' && (
          <section className="panel github-panel">
            <div className="search-row">
              <input aria-label="GitHub username" onChange={(event) => setGithubUser(event.target.value)} value={githubUser} />
              <button onClick={fetchGithubEvents} type="button">Fetch public activity</button>
            </div>
            <p className="status-line">{githubStatus}</p>
            <div className="metric-grid">
              <article><span>Events</span><strong>{githubEvents.length}</strong></article>
              <article><span>Repos</span><strong>{githubReport.repoCount}</strong></article>
              <article><span>Types</span><strong>{Object.keys(githubReport.byType).length}</strong></article>
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
            <textarea aria-label="CSV input" onChange={(event) => setCsvInput(event.target.value)} value={csvInput} />
            <div className="metric-grid">
              <article><span>Rows</span><strong>{csvReport.rows}</strong></article>
              <article><span>Missing</span><strong>{csvReport.missing}</strong></article>
              <article><span>Duplicates</span><strong>{csvReport.duplicates}</strong></article>
            </div>
            <label className="output-box">Cleaned CSV<textarea readOnly value={csvReport.cleaned} /></label>
          </section>
        )}

        {activeProject === 'logs' && (
          <section className="panel logs-panel">
            <textarea aria-label="Log input" onChange={(event) => setLogInput(event.target.value)} value={logInput} />
            <div className="metric-grid">
              <article><span>Lines</span><strong>{logReport.lines}</strong></article>
              <article><span>Errors</span><strong>{logReport.counts.error}</strong></article>
              <article><span>Warnings</span><strong>{logReport.counts.warn}</strong></article>
            </div>
            <div className="archive-card">
              <span>Archive name</span>
              <strong>{logReport.archiveName}</strong>
              <p>Info {logReport.counts.info} / Debug {logReport.counts.debug}</p>
            </div>
          </section>
        )}
      </section>

      <footer>
        <span>Built for {author}</span>
        <a href={portfolioUrl}>Portfolio link</a>
      </footer>
    </main>
  )
}

export default App
