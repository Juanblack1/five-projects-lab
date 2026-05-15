import type { ChangeEvent } from 'react'
import type { CopyState } from '../../shared/types'
import {
  formatLogTimestamp,
  logFilterOrder,
  type ConcreteLogSeverity,
  type LogEntry,
  type LogFilters,
  type LogSeverity,
  type LogTimeFilter,
} from './logModel'

type LogsCopy = {
  archive: string
  copyIncident: string
  copySummary: string
  countCritical: string
  countErrors: string
  countInfo: string
  countTotal: string
  countWarnings: string
  details: string
  downloadIncident: string
  empty: string
  emptyBody: string
  fileInvalid: string
  fileReadError: string
  fileTooLarge: (limit: string) => string
  filters: Record<LogSeverity, string>
  imported: (name: string) => string
  incidentTitle: string
  keywordCount: (count: number) => string
  level: string
  message: string
  origin: string
  query: string
  queryPlaceholder: string
  raw: string
  risk: string
  sampleLoaded: string
  severityMix: string
  signals: string
  simulate: string
  simulated: string
  sourceAll: string
  sourceMix: string
  summary: (critical: number, errors: number, warnings: number, lines: number) => string
  time: string
  timeFilters: Record<LogTimeFilter, string>
  timestamp: string
  upload: string
  uploadBody: string
  visibleLines: string
}

type CommonCopy = {
  loadSample: string
}

type LogReport = {
  archiveName: string
  counts: Record<ConcreteLogSeverity, number>
  lines: number
  sources: Record<string, number>
}

type LogsModuleProps = {
  copyIncidentReport: () => void
  copyLogSummary: () => void
  detectedLogSignals: { count: number; signal: string }[]
  getCopyMessage: (state: CopyState) => string
  handleLogFile: (file: File | null) => void
  incidentReport: string
  locale: string
  logActionMessage: string
  logCopyStatus: CopyState
  logEntries: LogEntry[]
  logFileError: string
  logFilters: LogFilters
  logInput: string
  logReport: LogReport
  maxSeverityCount: number
  maxSourceCount: number
  onDownloadIncident: () => void
  onLoadSample: () => void
  riskLabel: string
  selectedLog: LogEntry | null
  selectedLogId: string
  setLogFilter: <K extends keyof LogFilters>(key: K, value: LogFilters[K]) => void
  setLogInput: (value: string) => void
  setSelectedLogId: (id: string) => void
  severityEntries: { count: number; severity: ConcreteLogSeverity }[]
  simulateLogs: () => void
  sourceEntries: { count: number; source: string }[]
  tCommon: CommonCopy
  tLogs: LogsCopy
  title: string
  visibleLogs: LogEntry[]
}

const severityClass: Record<ConcreteLogSeverity, string> = {
  critical: 'critical',
  debug: 'debug',
  error: 'error',
  info: 'info',
  warn: 'warn',
}

export function LogsModule({
  copyIncidentReport,
  copyLogSummary,
  detectedLogSignals,
  getCopyMessage,
  handleLogFile,
  incidentReport,
  locale,
  logActionMessage,
  logCopyStatus,
  logEntries,
  logFileError,
  logFilters,
  logInput,
  logReport,
  maxSeverityCount,
  maxSourceCount,
  onDownloadIncident,
  onLoadSample,
  riskLabel,
  selectedLog,
  selectedLogId,
  setLogFilter,
  setLogInput,
  setSelectedLogId,
  severityEntries,
  simulateLogs,
  sourceEntries,
  tCommon,
  tLogs,
  title,
  visibleLogs,
}: LogsModuleProps) {
  const copyMessage = getCopyMessage(logCopyStatus)

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    handleLogFile(file)
    event.target.value = ''
  }

  return (
    <section className="panel logs-panel ops-console-panel" aria-label={title}>
      <section className="logs-command-grid">
        <label className="logs-input-card">
          <span>{tLogs.raw}</span>
          <textarea onChange={(event) => setLogInput(event.target.value)} value={logInput} />
        </label>

        <aside className="logs-ops-card" aria-label={tLogs.risk}>
          <span>{tLogs.risk}</span>
          <strong>{riskLabel}</strong>
          <p>
            {tLogs.summary(
              logReport.counts.critical,
              logReport.counts.error,
              logReport.counts.warn,
              logReport.lines,
            )}
          </p>
          <b>{logReport.archiveName}</b>
          <label className="logs-file-picker" htmlFor="logs-file-upload">
            <span>{tLogs.upload}</span>
            <p>{tLogs.uploadBody}</p>
            <input
              accept=".log,.txt,.json,text/plain,application/json"
              id="logs-file-upload"
              onChange={onFileChange}
              type="file"
            />
          </label>
          {logFileError && (
            <p className="logs-error" role="alert">
              {logFileError}
            </p>
          )}
          {logActionMessage && <em role="status">{logActionMessage}</em>}
          <div className="button-row logs-action-row">
            <button onClick={onLoadSample} type="button">
              {tCommon.loadSample}
            </button>
            <button onClick={simulateLogs} type="button">
              {tLogs.simulate}
            </button>
            <button className="primary-action" onClick={copyLogSummary} type="button">
              {tLogs.copySummary}
            </button>
            <button onClick={onDownloadIncident} type="button">
              {tLogs.downloadIncident}
            </button>
          </div>
          {copyMessage && <em role="status">{copyMessage}</em>}
        </aside>
      </section>

      <section className="logs-stat-grid" aria-label={tLogs.severityMix}>
        <article>
          <span>{tLogs.countTotal}</span>
          <strong>{logReport.lines}</strong>
        </article>
        <article className="critical">
          <span>{tLogs.countCritical}</span>
          <strong>{logReport.counts.critical}</strong>
        </article>
        <article className="error">
          <span>{tLogs.countErrors}</span>
          <strong>{logReport.counts.error}</strong>
        </article>
        <article className="warn">
          <span>{tLogs.countWarnings}</span>
          <strong>{logReport.counts.warn}</strong>
        </article>
        <article>
          <span>{tLogs.countInfo}</span>
          <strong>{logReport.counts.info}</strong>
        </article>
      </section>

      <section className="logs-filter-rack" aria-label={tLogs.query}>
        <label>
          <span>{tLogs.query}</span>
          <input
            onChange={(event) => setLogFilter('query', event.target.value)}
            placeholder={tLogs.queryPlaceholder}
            value={logFilters.query}
          />
        </label>
        <label>
          <span>{tLogs.origin}</span>
          <select
            onChange={(event) => setLogFilter('source', event.target.value)}
            value={logFilters.source}
          >
            <option value="all">{tLogs.sourceAll}</option>
            {sourceEntries.map((entry) => (
              <option key={entry.source} value={entry.source}>
                {entry.source}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{tLogs.time}</span>
          <select
            onChange={(event) => setLogFilter('time', event.target.value as LogTimeFilter)}
            value={logFilters.time}
          >
            {Object.entries(tLogs.timeFilters).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="severity-tabs logs-severity-tabs" role="group" aria-label={tLogs.level}>
        {logFilterOrder.map((severity) => (
          <button
            aria-pressed={logFilters.severity === severity}
            className={logFilters.severity === severity ? `active ${severity}` : severity}
            key={severity}
            onClick={() => setLogFilter('severity', severity)}
            type="button"
          >
            {tLogs.filters[severity]}
          </button>
        ))}
      </div>

      <section className="logs-analysis-grid">
        <article className="module-card incident-card logs-incident-card">
          <span>{tLogs.incidentTitle}</span>
          <strong>{riskLabel}</strong>
          <p>{incidentReport}</p>
          <button onClick={copyIncidentReport} type="button">
            {tLogs.copyIncident}
          </button>
        </article>
        <article className="module-card logs-dark-card">
          <span>{tLogs.severityMix}</span>
          <div className="bar-stack">
            {severityEntries.map((entry) => (
              <div className={`bar-row ${entry.severity}`} key={entry.severity}>
                <p>
                  <b>{tLogs.filters[entry.severity]}</b>
                  <em>{entry.count}</em>
                </p>
                <i style={{ width: `${Math.round((entry.count / maxSeverityCount) * 100)}%` }} />
              </div>
            ))}
          </div>
        </article>
        <article className="module-card logs-dark-card">
          <span>{tLogs.sourceMix}</span>
          <div className="bar-stack">
            {sourceEntries.map((entry) => (
              <div className="bar-row source" key={entry.source}>
                <p>
                  <b>{entry.source}</b>
                  <em>{entry.count}</em>
                </p>
                <i style={{ width: `${Math.round((entry.count / maxSourceCount) * 100)}%` }} />
              </div>
            ))}
          </div>
        </article>
        <article className="module-card logs-dark-card">
          <span>{tLogs.signals}</span>
          <div className="signal-grid">
            {detectedLogSignals.length === 0 && <p className="empty-line">{tLogs.empty}</p>}
            {detectedLogSignals.map((item) => (
              <b key={item.signal}>
                {item.signal} <span>{tLogs.keywordCount(item.count)}</span>
              </b>
            ))}
          </div>
        </article>
      </section>

      <section className="logs-stream-grid">
        <div className="log-stream" aria-label={tLogs.visibleLines}>
          <div className="section-head">
            <h3>{tLogs.visibleLines}</h3>
            <span>
              {visibleLogs.length} / {logEntries.length}
            </span>
          </div>
          {visibleLogs.length === 0 ? (
            <div className="logs-empty-state">
              <strong>{tLogs.empty}</strong>
              <p>{tLogs.emptyBody}</p>
            </div>
          ) : (
            <div className="log-list">
              {visibleLogs.map((entry) => (
                <button
                  aria-pressed={selectedLogId === entry.id}
                  className={`${severityClass[entry.severity]} ${selectedLogId === entry.id ? 'selected' : ''}`}
                  key={entry.id}
                  onClick={() => setSelectedLogId(entry.id)}
                  type="button"
                >
                  <span>{tLogs.filters[entry.severity]}</span>
                  <time>{formatLogTimestamp(entry, locale)}</time>
                  <b>{entry.source}</b>
                  <code>{entry.message}</code>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="log-detail-panel" aria-label={tLogs.details}>
          <span>{tLogs.details}</span>
          {selectedLog ? (
            <>
              <strong>{tLogs.filters[selectedLog.severity]}</strong>
              <dl>
                <div>
                  <dt>{tLogs.timestamp}</dt>
                  <dd>{selectedLog.timestamp ? formatLogTimestamp(selectedLog, locale) : '--'}</dd>
                </div>
                <div>
                  <dt>{tLogs.origin}</dt>
                  <dd>{selectedLog.source}</dd>
                </div>
                <div>
                  <dt>{tLogs.level}</dt>
                  <dd>{tLogs.filters[selectedLog.severity]}</dd>
                </div>
                <div>
                  <dt>{tLogs.message}</dt>
                  <dd>{selectedLog.message}</dd>
                </div>
              </dl>
              <code>{selectedLog.line}</code>
            </>
          ) : (
            <p>{tLogs.emptyBody}</p>
          )}
        </aside>
      </section>
    </section>
  )
}
