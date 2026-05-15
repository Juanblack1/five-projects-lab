import type { Language } from '../../hooks/useLanguagePreference'

export type ConcreteLogSeverity = 'critical' | 'debug' | 'error' | 'info' | 'warn'
export type LogSeverity = 'all' | ConcreteLogSeverity
export type LogTimeFilter = 'all' | 'lastHour' | 'withTimestamp' | 'withoutTimestamp'

export type LogFilters = {
  query: string
  severity: LogSeverity
  source: string
  time: LogTimeFilter
}

export type LogEntry = {
  id: string
  index: number
  line: string
  message: string
  severity: ConcreteLogSeverity
  source: string
  timestamp: Date | null
  timestampText: string
}

export type LogSummary = {
  archiveName: string
  counts: Record<ConcreteLogSeverity, number>
  lines: number
  sources: Record<string, number>
}

export type LogSignal = {
  count: number
  signal: string
}

export const MAX_LOG_FILE_SIZE = 2 * 1024 * 1024
export const defaultLogSource = 'system'
export const logFilterOrder: LogSeverity[] = ['all', 'critical', 'error', 'warn', 'info', 'debug']
export const logSeverityOrder: ConcreteLogSeverity[] = ['critical', 'error', 'warn', 'info', 'debug']
export const logSignals = ['critical', 'fatal', 'error', 'failed', 'timeout', 'denied', 'cache', 'retry']

export const defaultLogFilters: LogFilters = {
  query: '',
  severity: 'all',
  source: 'all',
  time: 'all',
}

export const sampleLogsByLanguage: Record<Language, string> = {
  'pt-BR': `2026-05-15T09:10:12Z [INFO] [api] requisicao concluida GET /api/projetos status=200
2026-05-15T09:11:40Z [WARN] [cache] cache ausente para /api/projetos retry=1
2026-05-15T09:12:08Z [ERROR] [worker] falha ao sincronizar analytics opcional timeout=3000ms
2026-05-15T09:12:40Z [DEBUG] [ui] ciclo de renderizacao 42
2026-05-15T09:13:10Z [CRITICAL] [billing] pagamento bloqueado denied transaction=9482
2026-05-15T09:14:02Z [INFO] [worker] nova tentativa concluida`,
  en: `2026-05-15T09:10:12Z [INFO] [api] request completed GET /api/projects status=200
2026-05-15T09:11:40Z [WARN] [cache] cache miss for /api/projects retry=1
2026-05-15T09:12:08Z [ERROR] [worker] failed to sync optional analytics timeout=3000ms
2026-05-15T09:12:40Z [DEBUG] [ui] render cycle 42
2026-05-15T09:13:10Z [CRITICAL] [billing] payment blocked denied transaction=9482
2026-05-15T09:14:02Z [INFO] [worker] retry completed`,
}

const levelPatterns: Array<[ConcreteLogSeverity, RegExp]> = [
  ['critical', /\b(critical|fatal|panic|emergency|crit)\b|\[(critical|fatal|crit)\]/i],
  ['error', /\b(error|exception|failed|failure|erro|falha)\b|\[(error|erro)\]/i],
  ['warn', /\b(warn|warning|aviso|alerta)\b|\[(warn|warning)\]/i],
  ['debug', /\b(debug|trace|debugging)\b|\[(debug|trace)\]/i],
]

export function getSeverity(line: string): ConcreteLogSeverity {
  for (const [severity, pattern] of levelPatterns) {
    if (pattern.test(line)) return severity
  }
  return 'info'
}

export function parseLogTimestamp(line: string) {
  const isoMatch = line.match(/\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/)
  const timestampText = isoMatch?.[0] ?? ''

  if (!timestampText) {
    return { timestamp: null, timestampText: '' }
  }

  const normalized = timestampText.includes('T') ? timestampText : timestampText.replace(' ', 'T')
  const timestamp = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}Z`)

  return {
    timestamp: Number.isNaN(timestamp.getTime()) ? null : timestamp,
    timestampText,
  }
}

function parseLogSource(line: string, severity: ConcreteLogSeverity, timestampText: string) {
  const explicit = line.match(/\b(?:source|service|origin|module)=([a-z0-9_.:/-]+)/i)?.[1]
  if (explicit) return explicit

  const bracketMatches = [...line.matchAll(/\[([^\]]+)\]/g)]
    .map((match) => match[1].trim())
    .filter(Boolean)
  const bracketSource = bracketMatches.find((value) => {
    const normalized = value.toLowerCase()
    return normalized !== severity && normalized !== 'warning' && normalized !== 'warn' && normalized !== 'info' && normalized !== 'debug' && normalized !== 'error' && normalized !== 'critical' && normalized !== 'fatal'
  })

  if (bracketSource) return bracketSource
  if (timestampText && line.startsWith(timestampText)) return defaultLogSource

  return defaultLogSource
}

function parseLogMessage(line: string, severity: ConcreteLogSeverity, timestampText: string, source: string) {
  return line
    .replace(timestampText, '')
    .replace(new RegExp(`\\[\\s*${severity}\\s*\\]`, 'i'), '')
    .replace(/\[\s*(warn|warning|error|info|debug|critical|fatal|trace)\s*\]/gi, '')
    .replace(new RegExp(`\\[\\s*${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`, 'i'), '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseLogLine(line: string, index: number): LogEntry {
  const severity = getSeverity(line)
  const { timestamp, timestampText } = parseLogTimestamp(line)
  const source = parseLogSource(line, severity, timestampText)
  const message = parseLogMessage(line, severity, timestampText, source)

  return {
    id: `${index}-${line}`,
    index,
    line,
    message: message || line,
    severity,
    source,
    timestamp,
    timestampText,
  }
}

export function parseLogs(input: string) {
  return input
    .split(/\r?\n/)
    .map((line, index) => parseLogLine(line.trim(), index))
    .filter((entry) => entry.line.length > 0)
}

export function summarizeLogEntries(entries: LogEntry[], date = new Date()): LogSummary {
  const counts: Record<ConcreteLogSeverity, number> = {
    critical: 0,
    debug: 0,
    error: 0,
    info: 0,
    warn: 0,
  }
  const sources: Record<string, number> = {}

  for (const entry of entries) {
    counts[entry.severity] += 1
    sources[entry.source] = (sources[entry.source] ?? 0) + 1
  }

  const stamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19)

  return {
    archiveName: `logs-${stamp}.txt`,
    counts,
    lines: entries.length,
    sources,
  }
}

export function getLogSignals(input: string): LogSignal[] {
  const normalized = input.toLowerCase()
  return logSignals
    .map((signal) => ({
      count: (normalized.match(new RegExp(signal, 'g')) ?? []).length,
      signal,
    }))
    .filter((item) => item.count > 0)
}

export function filterLogs(entries: LogEntry[], filters: LogFilters, now = new Date()) {
  const query = filters.query.trim().toLowerCase()
  const hourAgo = now.getTime() - 60 * 60 * 1000

  return entries.filter((entry) => {
    const severityMatches = filters.severity === 'all' || entry.severity === filters.severity
    const sourceMatches = filters.source === 'all' || entry.source === filters.source
    const queryMatches =
      !query ||
      entry.line.toLowerCase().includes(query) ||
      entry.source.toLowerCase().includes(query) ||
      entry.severity.toLowerCase().includes(query)
    const timeMatches =
      filters.time === 'all' ||
      (filters.time === 'withTimestamp' && Boolean(entry.timestamp)) ||
      (filters.time === 'withoutTimestamp' && !entry.timestamp) ||
      (filters.time === 'lastHour' && entry.timestamp !== null && entry.timestamp.getTime() >= hourAgo)

    return severityMatches && sourceMatches && queryMatches && timeMatches
  })
}

export function getSourceEntries(summary: LogSummary) {
  return Object.entries(summary.sources)
    .map(([source, count]) => ({ count, source }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source))
}

export function getSeverityEntries(summary: LogSummary) {
  return logSeverityOrder.map((severity) => ({
    count: summary.counts[severity],
    severity,
  }))
}

export function isAcceptedLogFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ['log', 'txt', 'json'].includes(extension) || file.type.startsWith('text/')
}

export function formatLogTimestamp(entry: LogEntry, locale: string) {
  if (!entry.timestamp) return '--'

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(entry.timestamp)
}

export function generateSimulatedLogs(date = new Date()) {
  const baseTime = date.getTime()
  const rows = [
    ['INFO', 'api', 'request accepted GET /health status=200'],
    ['WARN', 'cache', 'cache latency high p95=820ms retry=1'],
    ['ERROR', 'worker', 'job failed queue=emails timeout=5000ms'],
    ['CRITICAL', 'payments', 'circuit breaker open denied provider=stripe'],
    ['DEBUG', 'scheduler', 'heartbeat tick shard=2'],
  ]

  return rows
    .map(([level, source, message], index) => {
      const timestamp = new Date(baseTime + index * 25_000).toISOString()
      return `${timestamp} [${level}] [${source}] ${message}`
    })
    .join('\n')
}
