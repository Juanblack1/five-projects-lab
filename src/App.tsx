import { useEffect, useState, type CSSProperties } from 'react'
import './App.css'
import heroImage from './assets/hero.png'
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

type Language = 'pt-BR' | 'en'

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

type PresetTaskKey = 'deliverable' | 'quiet' | 'note'

type FocusTask = {
  id: string
  done: boolean
  label?: string
  labelKey?: PresetTaskKey
}

type LogSeverity = 'all' | 'debug' | 'error' | 'info' | 'warn'
type GithubRequestState = 'error' | 'idle' | 'loading' | 'success'
type CopyState = 'empty' | 'error' | 'idle' | 'success'

const timerModes = {
  break: 5 * 60,
  focus: 25 * 60,
}

const initialFocusTasks: FocusTask[] = [
  { done: false, id: 'f-1', labelKey: 'deliverable' },
  { done: false, id: 'f-2', labelKey: 'quiet' },
  { done: false, id: 'f-3', labelKey: 'note' },
]

const localeByLanguage: Record<Language, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
}

const currencyByLanguage: Record<Language, string> = {
  'pt-BR': 'BRL',
  en: 'USD',
}

const sampleCsvByLanguage: Record<Language, string> = {
  'pt-BR': `nome,trilha,status
Ana,Frontend,concluido
Bruno,Backend,
Ana,Frontend,concluido
Clara,Dados,revisao`,
  en: sampleCsv,
}

const sampleLogsByLanguage: Record<Language, string> = {
  'pt-BR': `[INFO] servidor iniciado na porta 4173
[WARN] cache ausente para /api/projetos
[ERROR] falha ao sincronizar analytics opcional
[INFO] nova tentativa concluida
[DEBUG] ciclo de renderizacao 42`,
  en: sampleLogs,
}

const copy = {
  'pt-BR': {
    shell: {
      appLabel: 'Suite de produto',
      authorPrefix: 'Criado para',
      footerLabel: 'Cinco produtos pequenos, funcionais e prontos para portfolio.',
      language: 'Idioma',
      navLabel: 'Escolha um modulo',
      portfolio: 'Abrir portfolio',
      securityBody: 'Sem segredos no cliente. Variaveis VITE_* sao publicas e a integracao GitHub usa endpoints publicos.',
      securityTitle: 'Seguro para demo',
      sidebarCopy: 'Um laboratorio compacto com produtividade, financas, API publica, dados e operacoes.',
      subtitle:
        'Alterne entre cinco mini-produtos reais, teste entradas, gere saidas e mostre dominio de interfaces praticas.',
      title: 'Five Projects Lab',
    },
    common: {
      add: 'Adicionar',
      clear: 'Limpar',
      copied: 'Copiado.',
      copyBlocked: 'O navegador bloqueou a copia.',
      copyEmpty: 'Nada para copiar ainda.',
      loadSample: 'Carregar exemplo',
      remove: 'Remover',
      reset: 'Reiniciar',
      status: 'Status',
    },
    hero: {
      current: 'Modulo ativo',
      metrics: {
        apps: 'apps',
        quality: 'qualidade CSV',
        sessions: 'sessoes',
      },
      summary: 'Painel da suite',
    },
    projects: {
      budget: {
        kicker: 'Financas pessoais',
        metricLabel: 'Saldo atual',
        skills: ['formularios', 'dados derivados', 'validacao'],
        summary: 'Controle receitas e despesas com categorias, saldo, taxa de poupanca e remocao segura.',
        title: 'Budget Pulse',
      },
      csv: {
        kicker: 'Higiene de dados',
        metricLabel: 'Pontuacao',
        skills: ['parsing', 'qualidade de dados', 'exportacao'],
        summary: 'Cole uma tabela CSV, remova duplicatas, encontre celulas vazias e exporte o resultado limpo.',
        title: 'CSV Clinic',
      },
      focus: {
        kicker: 'Cabine Pomodoro',
        metricLabel: 'Progresso',
        skills: ['timer', 'estado local', 'UX produtiva'],
        summary: 'Conduza um ciclo de foco com objetivo, checklist editavel, pausa e progresso visivel.',
        title: 'Focus Forge',
      },
      github: {
        kicker: 'API publica',
        metricLabel: 'Eventos',
        skills: ['fetch', 'estados async', 'tratamento de erro'],
        summary: 'Analise um usuario publico do GitHub sem token, com perfil, eventos, repositorios e falhas claras.',
        title: 'GitHub Pulse',
      },
      logs: {
        kicker: 'Operacoes',
        metricLabel: 'Risco',
        skills: ['texto', 'DevOps', 'resumo'],
        summary: 'Cole logs, filtre severidade, estime risco operacional e gere um resumo copiavel.',
        title: 'Log Forge',
      },
    },
    focus: {
      addTask: 'Adicionar tarefa',
      break: '5 min pausa',
      clearSessions: 'Zerar sessoes',
      completed: 'concluidas',
      done: 'pronto',
      emptyTask: 'Digite uma tarefa antes de adicionar.',
      focus: '25 min foco',
      intent: 'Objetivo do sprint',
      intentPlaceholder: 'Entregar uma melhoria visivel',
      pause: 'Pausar timer',
      progressLabel: 'Progresso do ciclo',
      sessions: 'Sessoes finalizadas',
      start: 'Iniciar timer',
      taskInput: 'Nova tarefa',
      taskLabels: {
        deliverable: 'Escolher um entregavel concreto',
        note: 'Escrever uma nota de conclusao em 2 linhas',
        quiet: 'Fechar chat e abas com ruido',
      },
      tasks: 'Checklist de lancamento',
      timerBreak: 'Janela de recuperacao',
      timerFocus: 'Sprint de foco profundo',
    },
    budget: {
      amount: 'Valor',
      balance: 'Saldo',
      category: 'Categoria',
      categoryEmpty: 'Adicione uma despesa para ver o mix por categoria.',
      expense: 'Despesa',
      expenseMix: 'Mix de despesas',
      income: 'Receita',
      invalid: 'Preencha nome, categoria e um valor positivo.',
      label: 'Nome',
      recent: 'Lancamentos recentes',
      savings: 'Poupanca',
      type: 'Tipo',
    },
    github: {
      analyze: 'Analisar perfil publico',
      emptyEvents: 'Nenhum evento publico foi encontrado para este usuario.',
      emptyProfile: 'Busque um usuario para carregar bio, repositorios e atividade publica.',
      errorPrefix: 'Nao foi possivel carregar o GitHub:',
      events: 'Eventos',
      followers: 'Seguidores',
      loaded: (count: number) => `${count} eventos publicos carregados.`,
      loading: 'Buscando atividade publica...',
      noEvents: 'Perfil carregado, mas sem eventos publicos recentes.',
      openProfile: 'Abrir perfil',
      profile: 'Perfil',
      ready: 'Pronto para buscar eventos publicos.',
      repos: 'Repos',
      username: 'Usuario GitHub',
    },
    csv: {
      cleanOutput: 'CSV limpo',
      copyClean: 'Copiar CSV limpo',
      downloadClean: 'Baixar CSV',
      duplicateCount: (count: number) => `${count} duplicata${count === 1 ? '' : 's'} removida${count === 1 ? '' : 's'}.`,
      missing: 'vazio',
      missingCount: (count: number) => `${count} celula${count === 1 ? '' : 's'} vazia${count === 1 ? '' : 's'}.`,
      preview: 'Previa limpa',
      quality: 'Pontuacao de qualidade',
      raw: 'CSV bruto',
      rowCount: (count: number) => `${count} linha${count === 1 ? '' : 's'} limpa${count === 1 ? '' : 's'}.`,
    },
    logs: {
      archive: 'Arquivo sugerido',
      copySummary: 'Copiar resumo',
      empty: 'Nenhum log visivel para este filtro.',
      filters: {
        all: 'todos',
        debug: 'debug',
        error: 'erros',
        info: 'info',
        warn: 'avisos',
      },
      raw: 'Logs brutos',
      risk: 'Risco operacional',
      riskHigh: 'Alto',
      riskLow: 'Baixo',
      riskMedium: 'Medio',
      summary: (errors: number, warnings: number, lines: number) =>
        `${errors} erro${errors === 1 ? '' : 's'}, ${warnings} aviso${warnings === 1 ? '' : 's'}, ${lines} linha${lines === 1 ? '' : 's'} no total.`,
      summaryText: (risk: string, archive: string, errors: number, warnings: number, lines: number) =>
        `Risco: ${risk}. Erros: ${errors}. Avisos: ${warnings}. Linhas: ${lines}. Arquivo: ${archive}.`,
    },
  },
  en: {
    shell: {
      appLabel: 'Product suite',
      authorPrefix: 'Built for',
      footerLabel: 'Five small functional products ready for a portfolio.',
      language: 'Language',
      navLabel: 'Choose a module',
      portfolio: 'Open portfolio',
      securityBody: 'No secrets in the client. VITE_* variables are public and GitHub uses public endpoints.',
      securityTitle: 'Demo safe',
      sidebarCopy: 'A compact lab for productivity, finance, public APIs, data and operations.',
      subtitle:
        'Switch between five real mini-products, test inputs, generate outputs and show practical interface range.',
      title: 'Five Projects Lab',
    },
    common: {
      add: 'Add',
      clear: 'Clear',
      copied: 'Copied.',
      copyBlocked: 'The browser blocked copying.',
      copyEmpty: 'Nothing to copy yet.',
      loadSample: 'Load sample',
      remove: 'Remove',
      reset: 'Reset',
      status: 'Status',
    },
    hero: {
      current: 'Active module',
      metrics: {
        apps: 'apps',
        quality: 'CSV quality',
        sessions: 'sessions',
      },
      summary: 'Suite dashboard',
    },
    projects: {
      budget: {
        kicker: 'Personal finance',
        metricLabel: 'Current balance',
        skills: ['forms', 'derived data', 'validation'],
        summary: 'Track income and expenses with categories, balance, savings rate and safe removal.',
        title: 'Budget Pulse',
      },
      csv: {
        kicker: 'Data hygiene',
        metricLabel: 'Score',
        skills: ['parsing', 'data quality', 'export'],
        summary: 'Paste CSV data, remove duplicates, find missing cells and export the cleaned result.',
        title: 'CSV Clinic',
      },
      focus: {
        kicker: 'Pomodoro cockpit',
        metricLabel: 'Progress',
        skills: ['timer', 'local state', 'productive UX'],
        summary: 'Run a focus cycle with an intent, editable checklist, break mode and visible progress.',
        title: 'Focus Forge',
      },
      github: {
        kicker: 'Public API',
        metricLabel: 'Events',
        skills: ['fetch', 'async states', 'error handling'],
        summary: 'Analyze a public GitHub user without a token, including profile, events, repos and clear failures.',
        title: 'GitHub Pulse',
      },
      logs: {
        kicker: 'Operations',
        metricLabel: 'Risk',
        skills: ['text', 'DevOps', 'summary'],
        summary: 'Paste logs, filter severity, estimate operational risk and generate a copyable summary.',
        title: 'Log Forge',
      },
    },
    focus: {
      addTask: 'Add task',
      break: '5 min break',
      clearSessions: 'Clear sessions',
      completed: 'completed',
      done: 'done',
      emptyTask: 'Type a task before adding it.',
      focus: '25 min focus',
      intent: 'Sprint intent',
      intentPlaceholder: 'Ship one visible improvement',
      pause: 'Pause timer',
      progressLabel: 'Cycle progress',
      sessions: 'Completed sessions',
      start: 'Start timer',
      taskInput: 'New task',
      taskLabels: {
        deliverable: 'Pick one concrete deliverable',
        note: 'Write a 2-line completion note',
        quiet: 'Close chat and noisy tabs',
      },
      tasks: 'Launch checklist',
      timerBreak: 'Recovery window',
      timerFocus: 'Deep work sprint',
    },
    budget: {
      amount: 'Amount',
      balance: 'Balance',
      category: 'Category',
      categoryEmpty: 'Add an expense to see the category mix.',
      expense: 'Expense',
      expenseMix: 'Expense mix',
      income: 'Income',
      invalid: 'Fill name, category and a positive amount.',
      label: 'Name',
      recent: 'Recent entries',
      savings: 'Savings',
      type: 'Type',
    },
    github: {
      analyze: 'Analyze public profile',
      emptyEvents: 'No public events were found for this user.',
      emptyProfile: 'Search a user to load public bio, repositories and activity.',
      errorPrefix: 'Could not load GitHub:',
      events: 'Events',
      followers: 'Followers',
      loaded: (count: number) => `Loaded ${count} public events.`,
      loading: 'Fetching public activity...',
      noEvents: 'Profile loaded, but no recent public events were found.',
      openProfile: 'Open profile',
      profile: 'Profile',
      ready: 'Ready to fetch public events.',
      repos: 'Repos',
      username: 'GitHub username',
    },
    csv: {
      cleanOutput: 'Cleaned CSV',
      copyClean: 'Copy cleaned CSV',
      downloadClean: 'Download CSV',
      duplicateCount: (count: number) => `${count} duplicate${count === 1 ? '' : 's'} removed.`,
      missing: 'missing',
      missingCount: (count: number) => `${count} missing cell${count === 1 ? '' : 's'}.`,
      preview: 'Clean preview',
      quality: 'Quality score',
      raw: 'Raw CSV',
      rowCount: (count: number) => `${count} clean row${count === 1 ? '' : 's'}.`,
    },
    logs: {
      archive: 'Suggested file',
      copySummary: 'Copy summary',
      empty: 'No logs match this filter.',
      filters: {
        all: 'all',
        debug: 'debug',
        error: 'errors',
        info: 'info',
        warn: 'warnings',
      },
      raw: 'Raw logs',
      risk: 'Operational risk',
      riskHigh: 'High',
      riskLow: 'Low',
      riskMedium: 'Medium',
      summary: (errors: number, warnings: number, lines: number) =>
        `${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}, ${lines} total line${lines === 1 ? '' : 's'}.`,
      summaryText: (risk: string, archive: string, errors: number, warnings: number, lines: number) =>
        `Risk: ${risk}. Errors: ${errors}. Warnings: ${warnings}. Lines: ${lines}. File: ${archive}.`,
    },
  },
}

function getInitialLanguage(): Language {
  const stored = window.localStorage.getItem('five-projects-language')
  if (stored === 'pt-BR' || stored === 'en') return stored
  return window.navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

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

function formatEventType(type: string) {
  return type.replace(/Event$/, '').replace(/([a-z])([A-Z])/g, '$1 $2')
}

function downloadText(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function App() {
  const author = import.meta.env.VITE_PUBLIC_AUTHOR || 'Portfolio Builder'
  const portfolioUrl = import.meta.env.VITE_PUBLIC_PORTFOLIO_URL || '#'
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const t = copy[language]
  const locale = localeByLanguage[language]
  const currency = currencyByLanguage[language]
  const [activeProject, setActiveProject] = useState<ProjectKey>('focus')
  const [timerMode, setTimerMode] = useState<'break' | 'focus'>('focus')
  const [secondsLeft, setSecondsLeft] = useState(timerModes.focus)
  const [timerRunning, setTimerRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [focusIntent, setFocusIntent] = useState(t.focus.intentPlaceholder)
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>(initialFocusTasks)
  const [taskDraft, setTaskDraft] = useState('')
  const [taskError, setTaskError] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [budgetError, setBudgetError] = useState('')
  const [transactionDraft, setTransactionDraft] = useState({
    amount: '240',
    category: language === 'pt-BR' ? 'Aprendizado' : 'Learning',
    label: language === 'pt-BR' ? 'Assinatura de curso' : 'Course subscription',
    type: 'expense' as Transaction['type'],
  })
  const [githubUser, setGithubUser] = useState('Juanblack1')
  const [githubEvents, setGithubEvents] = useState<GithubEvent[]>([])
  const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null)
  const [githubState, setGithubState] = useState<GithubRequestState>('idle')
  const [githubError, setGithubError] = useState('')
  const [githubLoadedAt, setGithubLoadedAt] = useState<Date | null>(null)
  const [csvInput, setCsvInput] = useState(sampleCsvByLanguage[language])
  const [csvCopyStatus, setCsvCopyStatus] = useState<CopyState>('idle')
  const [logInput, setLogInput] = useState(sampleLogsByLanguage[language])
  const [logSeverity, setLogSeverity] = useState<LogSeverity>('all')
  const [logCopyStatus, setLogCopyStatus] = useState<CopyState>('idle')
  const [archiveDate] = useState(() => new Date())

  useEffect(() => {
    window.localStorage.setItem('five-projects-language', language)
    document.documentElement.lang = language
  }, [language])

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
  const selectedProjectCopy = t.projects[activeProject]
  const activeStyle = { '--accent': selectedProject.accent } as CSSProperties
  const budget = calculateBudget(transactions)
  const csvReport = parseCsv(csvInput)
  const csvRows = csvReport.cleaned
    ? csvReport.cleaned.split('\n').map((row) => row.split(','))
    : []
  const csvHeaders = csvRows[0] ?? []
  const csvBody = csvRows.slice(1, 7)
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
  const riskLabel =
    logReport.counts.error > 0
      ? t.logs.riskHigh
      : logReport.counts.warn > 0
        ? t.logs.riskMedium
        : t.logs.riskLow
  const projectMetric =
    activeProject === 'focus'
      ? `${taskProgress}%`
      : activeProject === 'budget'
        ? formatCurrency(budget.balance, locale, currency)
        : activeProject === 'github'
          ? String(githubEvents.length)
          : activeProject === 'csv'
            ? `${csvQuality}%`
            : riskLabel

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage)
    setCsvCopyStatus('idle')
    setLogCopyStatus('idle')
  }

  function changeTimerMode(mode: 'break' | 'focus') {
    setTimerMode(mode)
    setSecondsLeft(timerModes[mode])
    setTimerRunning(false)
  }

  function addFocusTask() {
    const label = taskDraft.trim()
    if (!label) {
      setTaskError(t.focus.emptyTask)
      return
    }

    setFocusTasks((current) => [{ done: false, id: createId('task'), label }, ...current])
    setTaskDraft('')
    setTaskError('')
  }

  function removeFocusTask(id: string) {
    setFocusTasks((current) => current.filter((task) => task.id !== id))
  }

  function addTransaction() {
    const amount = Number(transactionDraft.amount)
    if (
      !transactionDraft.label.trim() ||
      !transactionDraft.category.trim() ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      setBudgetError(t.budget.invalid)
      return
    }

    setTransactions((current) => [
      {
        amount,
        category: transactionDraft.category.trim(),
        id: createId('transaction'),
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
      setGithubState('error')
      setGithubError(language === 'pt-BR' ? 'Digite um usuario primeiro.' : 'Type a username first.')
      return
    }

    setGithubState('loading')
    setGithubError('')
    try {
      const [profileResponse, eventsResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
        fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=8`,
        ),
      ])

      if (!profileResponse.ok) {
        throw new Error(`profile ${profileResponse.status}`)
      }

      if (!eventsResponse.ok) {
        throw new Error(`events ${eventsResponse.status}`)
      }

      const profile = (await profileResponse.json()) as GithubProfile
      const events = (await eventsResponse.json()) as GithubEvent[]
      setGithubProfile(profile)
      setGithubEvents(events)
      setGithubLoadedAt(new Date())
      setGithubState('success')
    } catch (error) {
      setGithubEvents([])
      setGithubProfile(null)
      setGithubState('error')
      setGithubError(error instanceof Error ? error.message : 'request failed')
    }
  }

  function getGithubStatus() {
    if (githubState === 'loading') return t.github.loading
    if (githubState === 'error') return `${t.github.errorPrefix} ${githubError}`
    if (githubState === 'success') {
      return githubEvents.length ? t.github.loaded(githubEvents.length) : t.github.noEvents
    }
    return t.github.ready
  }

  async function copyCleanCsv() {
    if (!csvReport.cleaned) {
      setCsvCopyStatus('empty')
      return
    }

    try {
      await navigator.clipboard.writeText(csvReport.cleaned)
      setCsvCopyStatus('success')
    } catch {
      setCsvCopyStatus('error')
    }
  }

  async function copyLogSummary() {
    if (!logInput.trim()) {
      setLogCopyStatus('empty')
      return
    }

    try {
      await navigator.clipboard.writeText(
        t.logs.summaryText(
          riskLabel,
          logReport.archiveName,
          logReport.counts.error,
          logReport.counts.warn,
          logReport.lines,
        ),
      )
      setLogCopyStatus('success')
    } catch {
      setLogCopyStatus('error')
    }
  }

  function getCopyMessage(state: CopyState) {
    if (state === 'success') return t.common.copied
    if (state === 'error') return t.common.copyBlocked
    if (state === 'empty') return t.common.copyEmpty
    return ''
  }

  function getTaskLabel(task: FocusTask) {
    if (task.label) return task.label
    if (task.labelKey) return t.focus.taskLabels[task.labelKey]
    return ''
  }

  return (
    <main className="app-shell" style={activeStyle}>
      <aside className="sidebar" aria-label={t.shell.appLabel}>
        <div className="brand-card">
          <img alt="" className="brand-art" src={heroImage} />
          <span>{t.shell.appLabel}</span>
          <strong>{t.shell.title}</strong>
          <p>{t.shell.sidebarCopy}</p>
        </div>

        <nav className="project-rail" aria-label={t.shell.navLabel}>
          {suiteProjects.map((project, index) => {
            const item = t.projects[project.key]
            return (
              <button
                aria-current={project.key === activeProject ? 'page' : undefined}
                className={project.key === activeProject ? 'active' : ''}
                key={project.key}
                onClick={() => setActiveProject(project.key)}
                style={{ '--accent': project.accent } as CSSProperties}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.title}</strong>
                <small>{item.kicker}</small>
              </button>
            )
          })}
        </nav>

        <div className="security-card">
          <strong>{t.shell.securityTitle}</strong>
          <p>{t.shell.securityBody}</p>
        </div>
      </aside>

      <section className="stage">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t.hero.summary}</p>
            <h1>{t.shell.title}</h1>
            <p>{t.shell.subtitle}</p>
          </div>

          <div className="language-switch" role="group" aria-label={t.shell.language}>
            {(['pt-BR', 'en'] as Language[]).map((option) => (
              <button
                aria-pressed={language === option}
                className={language === option ? 'active' : ''}
                key={option}
                onClick={() => changeLanguage(option)}
                type="button"
              >
                {option === 'pt-BR' ? 'PT-BR' : 'EN'}
              </button>
            ))}
          </div>
        </header>

        <section className="suite-strip" aria-label={t.hero.summary}>
          <article>
            <span>{t.hero.metrics.apps}</span>
            <strong>{suiteProjects.length}</strong>
          </article>
          <article>
            <span>{t.hero.metrics.sessions}</span>
            <strong>{completedSessions}</strong>
          </article>
          <article>
            <span>{t.hero.metrics.quality}</span>
            <strong>{csvQuality}%</strong>
          </article>
          <article className="active-snapshot">
            <span>{selectedProjectCopy.metricLabel}</span>
            <strong>{projectMetric}</strong>
          </article>
        </section>

        <section className="workbench">
          <aside className="project-brief">
            <p className="eyebrow">{t.hero.current}</p>
            <h2>{selectedProjectCopy.title}</h2>
            <p>{selectedProjectCopy.summary}</p>
            <div className="chips">
              {selectedProjectCopy.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </aside>

          {activeProject === 'focus' && (
            <section className="panel focus-panel" aria-label={selectedProjectCopy.title}>
              <div className="timer-card">
                <div className="timer-head">
                  <span>{timerMode === 'focus' ? t.focus.timerFocus : t.focus.timerBreak}</span>
                  <strong>{formatTimer(secondsLeft)}</strong>
                </div>
                <div
                  aria-label={t.focus.progressLabel}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={timerProgress}
                  className="progress"
                  role="progressbar"
                >
                  <i style={{ width: `${timerProgress}%` }} />
                </div>
                <div className="button-row">
                  <button className="primary-action" onClick={() => setTimerRunning((value) => !value)} type="button">
                    {timerRunning ? t.focus.pause : t.focus.start}
                  </button>
                  <button
                    aria-pressed={timerMode === 'focus'}
                    className={timerMode === 'focus' ? 'selected' : ''}
                    onClick={() => changeTimerMode('focus')}
                    type="button"
                  >
                    {t.focus.focus}
                  </button>
                  <button
                    aria-pressed={timerMode === 'break'}
                    className={timerMode === 'break' ? 'selected' : ''}
                    onClick={() => changeTimerMode('break')}
                    type="button"
                  >
                    {t.focus.break}
                  </button>
                  <button onClick={() => setSecondsLeft(timerModes[timerMode])} type="button">
                    {t.common.reset}
                  </button>
                </div>
              </div>

              <div className="side-grid">
                <label className="field-card">
                  <span>{t.focus.intent}</span>
                  <input
                    onChange={(event) => setFocusIntent(event.target.value)}
                    placeholder={t.focus.intentPlaceholder}
                    value={focusIntent}
                  />
                </label>
                <article className="module-card">
                  <span>{t.focus.sessions}</span>
                  <strong>{completedSessions}</strong>
                  <button onClick={() => setCompletedSessions(0)} type="button">
                    {t.focus.clearSessions}
                  </button>
                </article>
                <article className="module-card task-card">
                  <div className="card-title-row">
                    <span>{t.focus.tasks}</span>
                    <b>{taskProgress}% {t.focus.done}</b>
                  </div>
                  <div className="task-input-row">
                    <input
                      aria-label={t.focus.taskInput}
                      onChange={(event) => setTaskDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') addFocusTask()
                      }}
                      placeholder={t.focus.taskInput}
                      value={taskDraft}
                    />
                    <button onClick={addFocusTask} type="button">
                      {t.common.add}
                    </button>
                  </div>
                  {taskError && (
                    <p className="error-line" role="alert">
                      {taskError}
                    </p>
                  )}
                  <div className="task-list">
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
                        <span>{getTaskLabel(task)}</span>
                        <button
                          aria-label={`${t.common.remove}: ${getTaskLabel(task)}`}
                          onClick={() => removeFocusTask(task.id)}
                          type="button"
                        >
                          {t.common.remove}
                        </button>
                      </label>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeProject === 'budget' && (
            <section className="panel budget-panel" aria-label={selectedProjectCopy.title}>
              <div className="metric-grid">
                <article>
                  <span>{t.budget.income}</span>
                  <strong>{formatCurrency(budget.income, locale, currency)}</strong>
                </article>
                <article>
                  <span>{t.budget.expense}</span>
                  <strong>{formatCurrency(budget.expense, locale, currency)}</strong>
                </article>
                <article>
                  <span>{t.budget.savings}</span>
                  <strong>{savingsRate}%</strong>
                </article>
              </div>

              <div className="form-grid">
                <label>
                  <span>{t.budget.label}</span>
                  <input
                    onChange={(event) => setTransactionDraft({ ...transactionDraft, label: event.target.value })}
                    value={transactionDraft.label}
                  />
                </label>
                <label>
                  <span>{t.budget.amount}</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => setTransactionDraft({ ...transactionDraft, amount: event.target.value })}
                    type="number"
                    value={transactionDraft.amount}
                  />
                </label>
                <label>
                  <span>{t.budget.category}</span>
                  <input
                    onChange={(event) =>
                      setTransactionDraft({ ...transactionDraft, category: event.target.value })
                    }
                    value={transactionDraft.category}
                  />
                </label>
                <label>
                  <span>{t.budget.type}</span>
                  <select
                    onChange={(event) =>
                      setTransactionDraft({
                        ...transactionDraft,
                        type: event.target.value as Transaction['type'],
                      })
                    }
                    value={transactionDraft.type}
                  >
                    <option value="expense">{t.budget.expense}</option>
                    <option value="income">{t.budget.income}</option>
                  </select>
                </label>
                <button className="primary-action" onClick={addTransaction} type="button">
                  {t.common.add}
                </button>
              </div>
              {budgetError && (
                <p className="error-line" role="alert">
                  {budgetError}
                </p>
              )}

              <div className="budget-grid">
                <section className="ledger" aria-label={t.budget.recent}>
                  <h3>{t.budget.recent}</h3>
                  {transactions.map((transaction) => (
                    <article key={transaction.id}>
                      <div>
                        <strong>{transaction.label}</strong>
                        <span>{transaction.category}</span>
                      </div>
                      <b>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount, locale, currency)}
                      </b>
                      <button
                        onClick={() =>
                          setTransactions((current) => current.filter((item) => item.id !== transaction.id))
                        }
                        type="button"
                      >
                        {t.common.remove}
                      </button>
                    </article>
                  ))}
                </section>
                <section className="category-card" aria-label={t.budget.expenseMix}>
                  <h3>{t.budget.expenseMix}</h3>
                  {categoryEntries.length === 0 && <p>{t.budget.categoryEmpty}</p>}
                  {categoryEntries.map(([category, amount]) => (
                    <div key={category}>
                      <p>
                        <b>{category}</b>
                        <em>{formatCurrency(amount, locale, currency)}</em>
                      </p>
                      <i style={{ width: `${Math.round((amount / topExpense) * 100)}%` }} />
                    </div>
                  ))}
                </section>
              </div>
            </section>
          )}

          {activeProject === 'github' && (
            <section
              aria-busy={githubState === 'loading'}
              aria-label={selectedProjectCopy.title}
              className="panel github-panel"
            >
              <div className="search-row">
                <label>
                  <span>{t.github.username}</span>
                  <input onChange={(event) => setGithubUser(event.target.value)} value={githubUser} />
                </label>
                <button
                  className="primary-action"
                  disabled={githubState === 'loading'}
                  onClick={fetchGithubEvents}
                  type="button"
                >
                  {githubState === 'loading' ? t.github.loading : t.github.analyze}
                </button>
              </div>
              <p className={githubState === 'error' ? 'status-line error' : 'status-line'} role="status">
                {getGithubStatus()}
              </p>

              <div className="github-grid">
                <article className="profile-card">
                  {githubProfile?.avatar_url ? (
                    <img alt="" src={githubProfile.avatar_url} />
                  ) : (
                    <div className="avatar-fallback">{githubUser.slice(0, 2).toUpperCase()}</div>
                  )}
                  <div>
                    <span>{t.github.profile}</span>
                    <strong>{githubProfile?.name || githubProfile?.login || githubUser}</strong>
                    <p>{githubProfile?.bio || t.github.emptyProfile}</p>
                    {githubProfile?.html_url && (
                      <a href={githubProfile.html_url} rel="noreferrer" target="_blank">
                        {t.github.openProfile}
                      </a>
                    )}
                  </div>
                </article>
                <div className="metric-grid compact">
                  <article>
                    <span>{t.github.events}</span>
                    <strong>{githubEvents.length}</strong>
                  </article>
                  <article>
                    <span>{t.github.repos}</span>
                    <strong>{githubProfile?.public_repos ?? githubReport.repoCount}</strong>
                  </article>
                  <article>
                    <span>{t.github.followers}</span>
                    <strong>{githubProfile?.followers ?? 0}</strong>
                  </article>
                </div>
              </div>

              <div className="event-list">
                {githubEvents.length === 0 && githubState === 'success' && (
                  <p className="empty-line">{t.github.emptyEvents}</p>
                )}
                {githubEvents.map((event) => (
                  <article key={event.id}>
                    <strong>{formatEventType(event.type)}</strong>
                    <span>{event.repo?.name ?? 'Unknown repo'}</span>
                    <time dateTime={event.created_at}>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(event.created_at))}
                    </time>
                  </article>
                ))}
              </div>
              {githubLoadedAt && (
                <p className="subtle-line">
                  {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                    githubLoadedAt,
                  )}
                </p>
              )}
            </section>
          )}

          {activeProject === 'csv' && (
            <section className="panel data-panel" aria-label={selectedProjectCopy.title}>
              <div className="editor-grid">
                <label>
                  <span>{t.csv.raw}</span>
                  <textarea onChange={(event) => setCsvInput(event.target.value)} value={csvInput} />
                </label>
                <div className="quality-card">
                  <span>{t.csv.quality}</span>
                  <strong>{csvQuality}</strong>
                  <p>
                    {t.csv.rowCount(csvReport.rows)} {t.csv.duplicateCount(csvReport.duplicates)}{' '}
                    {t.csv.missingCount(csvReport.missing)}
                  </p>
                  <div className="button-row">
                    <button onClick={() => setCsvInput(sampleCsvByLanguage[language])} type="button">
                      {t.common.loadSample}
                    </button>
                    <button className="primary-action" onClick={copyCleanCsv} type="button">
                      {t.csv.copyClean}
                    </button>
                    <button
                      onClick={() => downloadText('cleaned-data.csv', csvReport.cleaned, 'text/csv')}
                      type="button"
                    >
                      {t.csv.downloadClean}
                    </button>
                  </div>
                  {getCopyMessage(csvCopyStatus) && <em role="status">{getCopyMessage(csvCopyStatus)}</em>}
                </div>
              </div>
              <div className="table-card">
                <h3>{t.csv.preview}</h3>
                <table>
                  <thead>
                    <tr>{csvHeaders.map((header) => <th key={header}>{header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {csvBody.map((row, rowIndex) => (
                      <tr key={`${row.join('-')}-${rowIndex}`}>
                        {row.map((cell, index) => (
                          <td key={`${cell}-${index}`}>{cell || t.csv.missing}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="output-box">
                <span>{t.csv.cleanOutput}</span>
                <textarea readOnly value={csvReport.cleaned} />
              </label>
            </section>
          )}

          {activeProject === 'logs' && (
            <section className="panel logs-panel" aria-label={selectedProjectCopy.title}>
              <div className="editor-grid">
                <label>
                  <span>{t.logs.raw}</span>
                  <textarea onChange={(event) => setLogInput(event.target.value)} value={logInput} />
                </label>
                <div className="quality-card danger">
                  <span>{t.logs.risk}</span>
                  <strong>{riskLabel}</strong>
                  <p>
                    {t.logs.summary(logReport.counts.error, logReport.counts.warn, logReport.lines)}
                  </p>
                  <b>{logReport.archiveName}</b>
                  <div className="button-row">
                    <button onClick={() => setLogInput(sampleLogsByLanguage[language])} type="button">
                      {t.common.loadSample}
                    </button>
                    <button className="primary-action" onClick={copyLogSummary} type="button">
                      {t.logs.copySummary}
                    </button>
                  </div>
                  {getCopyMessage(logCopyStatus) && <em role="status">{getCopyMessage(logCopyStatus)}</em>}
                </div>
              </div>
              <div className="severity-tabs" role="group" aria-label={t.logs.risk}>
                {(['all', 'error', 'warn', 'info', 'debug'] as LogSeverity[]).map((severity) => (
                  <button
                    aria-pressed={logSeverity === severity}
                    className={logSeverity === severity ? 'active' : ''}
                    key={severity}
                    onClick={() => setLogSeverity(severity)}
                    type="button"
                  >
                    {t.logs.filters[severity]}
                  </button>
                ))}
              </div>
              <div className="log-list">
                {visibleLogs.length === 0 && <p className="empty-line">{t.logs.empty}</p>}
                {visibleLogs.map((entry) => (
                  <article className={entry.severity} key={entry.id}>
                    <span>{t.logs.filters[entry.severity]}</span>
                    <code>{entry.line}</code>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>

        <footer>
          <span>
            {t.shell.authorPrefix} {author}. {t.shell.footerLabel}
          </span>
          <a href={portfolioUrl}>{t.shell.portfolio}</a>
        </footer>
      </section>
    </main>
  )
}

export default App
