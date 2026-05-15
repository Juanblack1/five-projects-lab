import { useMemo, useState } from 'react'
import type { Language } from '../../hooks/useLanguagePreference'
import type { CopyState } from '../../shared/types'
import {
  MAX_LOG_FILE_SIZE,
  defaultLogFilters,
  filterLogs,
  generateSimulatedLogs,
  getLogSignals,
  getSeverityEntries,
  getSourceEntries,
  isAcceptedLogFile,
  parseLogs,
  sampleLogsByLanguage,
  summarizeLogEntries,
  type ConcreteLogSeverity,
  type LogEntry,
  type LogFilters,
} from './logModel'

type LogsCopy = {
  fileInvalid: string
  fileReadError: string
  fileTooLarge: (limit: string) => string
  imported: (name: string) => string
  riskCritical: string
  riskHigh: string
  riskLow: string
  riskMedium: string
  sampleLoaded: string
  simulated: string
  summaryText: (
    risk: string,
    archive: string,
    critical: number,
    errors: number,
    warnings: number,
    lines: number,
  ) => string
}

function formatBytes(bytes: number, locale: string) {
  if (bytes < 1024) {
    return `${new Intl.NumberFormat(locale).format(bytes)} B`
  }

  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
  }

  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`
}

function getRiskLabel(counts: Record<ConcreteLogSeverity, number>, tLogs: LogsCopy) {
  if (counts.critical > 0) return tLogs.riskCritical
  if (counts.error > 0) return tLogs.riskHigh
  if (counts.warn > 0) return tLogs.riskMedium
  return tLogs.riskLow
}

export function useLogsModule(language: Language, tLogs: LogsCopy, locale: string) {
  const [logInput, setLogInput] = useState(sampleLogsByLanguage[language])
  const [logFilters, setLogFilters] = useState<LogFilters>(defaultLogFilters)
  const [selectedLogId, setSelectedLogId] = useState('')
  const [logCopyStatus, setLogCopyStatus] = useState<CopyState>('idle')
  const [logFileError, setLogFileError] = useState('')
  const [logActionMessage, setLogActionMessage] = useState('')
  const [archiveDate] = useState(() => new Date())

  const logEntries = useMemo(() => parseLogs(logInput), [logInput])
  const logReport = useMemo(() => summarizeLogEntries(logEntries, archiveDate), [archiveDate, logEntries])
  const visibleLogs = useMemo(() => filterLogs(logEntries, logFilters), [logEntries, logFilters])
  const severityEntries = useMemo(() => getSeverityEntries(logReport), [logReport])
  const sourceEntries = useMemo(() => getSourceEntries(logReport), [logReport])
  const detectedLogSignals = useMemo(() => getLogSignals(logInput), [logInput])
  const maxSeverityCount = Math.max(...severityEntries.map((entry) => entry.count), 1)
  const maxSourceCount = Math.max(...sourceEntries.map((entry) => entry.count), 1)
  const selectedLog: LogEntry | null =
    visibleLogs.find((entry) => entry.id === selectedLogId) ?? visibleLogs[0] ?? null
  const riskLabel = getRiskLabel(logReport.counts, tLogs)
  const incidentReport = tLogs.summaryText(
    riskLabel,
    logReport.archiveName,
    logReport.counts.critical,
    logReport.counts.error,
    logReport.counts.warn,
    logReport.lines,
  )

  function setLogFilter<K extends keyof LogFilters>(key: K, value: LogFilters[K]) {
    setLogFilters((current) => ({ ...current, [key]: value }))
    setSelectedLogId('')
  }

  async function copyText(text: string) {
    if (!text.trim()) {
      setLogCopyStatus('empty')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setLogCopyStatus('success')
    } catch {
      setLogCopyStatus('error')
    }
  }

  function copyLogSummary() {
    copyText(incidentReport)
  }

  function copyIncidentReport() {
    copyText(incidentReport)
  }

  async function handleLogFile(file: File | null) {
    setLogCopyStatus('idle')
    setLogActionMessage('')

    if (!file) return

    if (!isAcceptedLogFile(file)) {
      setLogFileError(tLogs.fileInvalid)
      return
    }

    if (file.size > MAX_LOG_FILE_SIZE) {
      setLogFileError(tLogs.fileTooLarge(formatBytes(MAX_LOG_FILE_SIZE, locale)))
      return
    }

    try {
      const text = await file.text()
      setLogInput(text)
      setLogFilters(defaultLogFilters)
      setSelectedLogId('')
      setLogFileError('')
      setLogActionMessage(tLogs.imported(file.name))
    } catch {
      setLogFileError(tLogs.fileReadError)
    }
  }

  function loadSampleLogs() {
    setLogInput(sampleLogsByLanguage[language])
    setLogFilters(defaultLogFilters)
    setSelectedLogId('')
    setLogFileError('')
    setLogActionMessage(tLogs.sampleLoaded)
  }

  function simulateLogs() {
    setLogInput((current) => `${current.trim() ? `${current.trim()}\n` : ''}${generateSimulatedLogs(new Date())}`)
    setLogActionMessage(tLogs.simulated)
  }

  return {
    copyIncidentReport,
    copyLogSummary,
    detectedLogSignals,
    handleLogFile,
    incidentReport,
    logActionMessage,
    logCopyStatus,
    logEntries,
    logFileError,
    logFilters,
    logInput,
    logReport,
    loadSampleLogs,
    maxSeverityCount,
    maxSourceCount,
    riskLabel,
    selectedLog,
    selectedLogId,
    setLogCopyStatus,
    setLogFilter,
    setLogInput,
    setSelectedLogId,
    severityEntries,
    simulateLogs,
    sourceEntries,
    visibleLogs,
  }
}
