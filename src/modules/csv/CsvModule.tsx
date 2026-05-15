import type { ChangeEvent } from 'react'
import type { CopyState } from '../../shared/types'
import { CSV_PREVIEW_LIMIT, type CsvCleanOptions, type CsvFileMeta, type CsvReport } from './csvModel'

type CsvCopy = {
  applyClean: string
  applyReplace: string
  beforePreview: string
  cleanOptions: string
  cleanOutput: string
  cleanedApplied: string
  columnCount: string
  columnProfile: string
  columnsDetected: string
  copyClean: string
  downloadClean: string
  duplicateRows: string
  duplicateCount: (count: number) => string
  emptyCells: string
  emptyPreview: string
  emptyRows: string
  fileInfo: string
  fileInvalid: string
  fileName: string
  fileReadError: string
  fileSize: string
  fileTooLarge: (limit: string) => string
  filter: string
  filterPlaceholder: string
  find: string
  inconsistentRows: string
  issues: string
  missing: string
  missingCount: (count: number) => string
  noIssues: string
  normalizeHeaders: string
  optionNormalizeHeaders: string
  optionRemoveDuplicates: string
  optionRemoveEmptyRows: string
  optionTrimCells: string
  preview: string
  previewLimit: (limit: number) => string
  quality: string
  raw: string
  replaceWith: string
  rowCount: (count: number) => string
  rows: string
  sampleFile: string
  sampleLoaded: string
  unnamedColumn: string
  unnamedColumns: string
  uniqueValues: string
  upload: string
  uploadBody: string
  uploadTitle: string
}

type CommonCopy = {
  loadSample: string
}

type CsvModuleProps = {
  applyCsvClean: () => void
  applyCsvReplace: () => void
  copyCleanCsv: () => void
  csvActionMessage: string
  csvCleanOptions: CsvCleanOptions
  csvCleanPreviewLimited: boolean
  csvCleanPreviewRows: string[][]
  csvCopyStatus: CopyState
  csvFileError: string
  csvFileMeta: CsvFileMeta | null
  csvFilter: string
  csvFind: string
  csvInput: string
  csvPreviewLimited: boolean
  csvPreviewRows: string[][]
  csvQuality: number
  csvReplace: string
  csvReport: CsvReport
  formatCsvBytes: (bytes: number) => string
  getCopyMessage: (state: CopyState) => string
  handleCsvFile: (file: File | null) => void
  normalizeCsvHeaders: () => void
  onDownloadClean: () => void
  onLoadSample: () => void
  setCsvCleanOption: (option: keyof CsvCleanOptions, value: boolean) => void
  setCsvFilter: (value: string) => void
  setCsvFind: (value: string) => void
  setCsvInput: (value: string) => void
  setCsvReplace: (value: string) => void
  tCommon: CommonCopy
  tCsv: CsvCopy
  title: string
}

type CsvTablePreviewProps = {
  emptyLabel: string
  headers: string[]
  limited: boolean
  previewLimit: string
  rows: string[][]
  tCsv: CsvCopy
  title: string
}

function getHeaderLabel(header: string, index: number, tCsv: CsvCopy) {
  return header.trim() || `${tCsv.unnamedColumn} ${index + 1}`
}

function CsvTablePreview({
  emptyLabel,
  headers,
  limited,
  previewLimit,
  rows,
  tCsv,
  title,
}: CsvTablePreviewProps) {
  return (
    <article className="csv-table-panel">
      <div className="section-head">
        <h3>{title}</h3>
        {limited && <span>{previewLimit}</span>}
      </div>
      <div className="csv-table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`${header}-${index}`}>{getHeaderLabel(header, index, tCsv)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <tr key={`${row.join('-')}-${rowIndex}`}>
                  {headers.map((_, index) => (
                    <td key={`${row[index] ?? ''}-${index}`}>{row[index] || tCsv.missing}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(headers.length, 1)}>{emptyLabel}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export function CsvModule({
  applyCsvClean,
  applyCsvReplace,
  copyCleanCsv,
  csvActionMessage,
  csvCleanOptions,
  csvCleanPreviewLimited,
  csvCleanPreviewRows,
  csvCopyStatus,
  csvFileError,
  csvFileMeta,
  csvFilter,
  csvFind,
  csvInput,
  csvPreviewLimited,
  csvPreviewRows,
  csvQuality,
  csvReplace,
  csvReport,
  formatCsvBytes,
  getCopyMessage,
  handleCsvFile,
  normalizeCsvHeaders,
  onDownloadClean,
  onLoadSample,
  setCsvCleanOption,
  setCsvFilter,
  setCsvFind,
  setCsvInput,
  setCsvReplace,
  tCommon,
  tCsv,
  title,
}: CsvModuleProps) {
  const hasCsv = csvReport.columnCount > 0
  const previewLimitCopy = tCsv.previewLimit(CSV_PREVIEW_LIMIT)
  const copyMessage = getCopyMessage(csvCopyStatus)

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    handleCsvFile(file)
    event.target.value = ''
  }

  return (
    <section className="panel data-panel csv-lab-panel" aria-label={title}>
      <section className="csv-command-center">
        <div className="csv-upload-card">
          <label htmlFor="csv-file-upload">
            <span>{tCsv.upload}</span>
            <strong>{tCsv.uploadTitle}</strong>
            <p>{tCsv.uploadBody}</p>
          </label>
          <input
            accept=".csv,text/csv"
            id="csv-file-upload"
            onChange={onFileChange}
            type="file"
          />
          {csvFileError && (
            <p className="csv-error" role="alert">
              {csvFileError}
            </p>
          )}
        </div>

        <article className="quality-card csv-quality-card">
          <span>{tCsv.quality}</span>
          <strong>{csvQuality}</strong>
          <p>
            {tCsv.rowCount(csvReport.rowCount)} {tCsv.duplicateCount(csvReport.duplicateRows)}{' '}
            {tCsv.missingCount(csvReport.emptyCells)}
          </p>
          {csvActionMessage && <em role="status">{csvActionMessage}</em>}
        </article>
      </section>

      <section className="csv-metric-grid" aria-label={tCsv.fileInfo}>
        <article>
          <span>{tCsv.fileName}</span>
          <strong>{csvFileMeta?.name ?? tCsv.sampleFile}</strong>
        </article>
        <article>
          <span>{tCsv.rows}</span>
          <strong>{csvReport.rowCount}</strong>
        </article>
        <article>
          <span>{tCsv.columnCount}</span>
          <strong>{csvReport.columnCount}</strong>
        </article>
        <article>
          <span>{tCsv.fileSize}</span>
          <strong>{csvFileMeta ? formatCsvBytes(csvFileMeta.size) : formatCsvBytes(csvInput.length)}</strong>
        </article>
      </section>

      <section className="tool-card csv-clean-panel" aria-label={tCsv.cleanOptions}>
        <div>
          <span>{tCsv.cleanOptions}</span>
          <strong>{tCsv.columnsDetected}</strong>
          <p>
            {csvReport.rawHeaders.map((header, index) => getHeaderLabel(header, index, tCsv)).join(', ') || '-'}
          </p>
        </div>
        <label>
          <input
            checked={csvCleanOptions.removeEmptyRows}
            onChange={(event) => setCsvCleanOption('removeEmptyRows', event.target.checked)}
            type="checkbox"
          />
          <span>{tCsv.optionRemoveEmptyRows}</span>
        </label>
        <label>
          <input
            checked={csvCleanOptions.removeDuplicates}
            onChange={(event) => setCsvCleanOption('removeDuplicates', event.target.checked)}
            type="checkbox"
          />
          <span>{tCsv.optionRemoveDuplicates}</span>
        </label>
        <label>
          <input
            checked={csvCleanOptions.trimCells}
            onChange={(event) => setCsvCleanOption('trimCells', event.target.checked)}
            type="checkbox"
          />
          <span>{tCsv.optionTrimCells}</span>
        </label>
        <label>
          <input
            checked={csvCleanOptions.normalizeHeaders}
            onChange={(event) => setCsvCleanOption('normalizeHeaders', event.target.checked)}
            type="checkbox"
          />
          <span>{tCsv.optionNormalizeHeaders}</span>
        </label>
        <button className="primary-action" disabled={!hasCsv} onClick={applyCsvClean} type="button">
          {tCsv.applyClean}
        </button>
      </section>

      <div className="editor-grid csv-editor-grid">
        <label>
          <span>{tCsv.raw}</span>
          <textarea onChange={(event) => setCsvInput(event.target.value)} value={csvInput} />
        </label>
        <div className="csv-tool-stack">
          <label>
            <span>{tCsv.filter}</span>
            <input
              onChange={(event) => setCsvFilter(event.target.value)}
              placeholder={tCsv.filterPlaceholder}
              value={csvFilter}
            />
          </label>
          <div className="csv-replace-grid">
            <label>
              <span>{tCsv.find}</span>
              <input onChange={(event) => setCsvFind(event.target.value)} value={csvFind} />
            </label>
            <label>
              <span>{tCsv.replaceWith}</span>
              <input onChange={(event) => setCsvReplace(event.target.value)} value={csvReplace} />
            </label>
          </div>
          <div className="button-row csv-action-row">
            <button onClick={applyCsvReplace} type="button">
              {tCsv.applyReplace}
            </button>
            <button onClick={normalizeCsvHeaders} type="button">
              {tCsv.normalizeHeaders}
            </button>
            <button onClick={onLoadSample} type="button">
              {tCommon.loadSample}
            </button>
          </div>
          <div className="button-row csv-action-row">
            <button className="primary-action" disabled={!hasCsv} onClick={copyCleanCsv} type="button">
              {tCsv.copyClean}
            </button>
            <button disabled={!hasCsv} onClick={onDownloadClean} type="button">
              {tCsv.downloadClean}
            </button>
          </div>
          {copyMessage && <em role="status">{copyMessage}</em>}
        </div>
      </div>

      <section className="csv-issue-grid" aria-label={tCsv.issues}>
        {csvReport.issues.length > 0 ? (
          csvReport.issues.map((issue) => (
            <article key={issue.key}>
              <span>{tCsv[issue.key]}</span>
              <strong>{issue.count}</strong>
            </article>
          ))
        ) : (
          <article className="csv-issue-clear">
            <span>{tCsv.issues}</span>
            <strong>{tCsv.noIssues}</strong>
          </article>
        )}
      </section>

      <section className="column-profile csv-column-profile" aria-label={tCsv.columnProfile}>
        <div className="section-head">
          <h3>{tCsv.columnProfile}</h3>
          <span>{csvReport.columnCount}</span>
        </div>
        <div>
          {csvReport.columnStats.map((column, index) => (
            <article key={`${column.header}-${index}`}>
              <span>{getHeaderLabel(column.header, index, tCsv)}</span>
              <strong>{column.filled}</strong>
              <p>
                {column.missing} {tCsv.missing} / {column.unique} {tCsv.uniqueValues}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="csv-preview-grid" aria-label={tCsv.preview}>
        <CsvTablePreview
          emptyLabel={tCsv.emptyPreview}
          headers={csvReport.rawHeaders}
          limited={csvPreviewLimited}
          previewLimit={previewLimitCopy}
          rows={csvPreviewRows}
          tCsv={tCsv}
          title={tCsv.beforePreview}
        />
        <CsvTablePreview
          emptyLabel={tCsv.emptyPreview}
          headers={csvReport.cleanedHeaders}
          limited={csvCleanPreviewLimited}
          previewLimit={previewLimitCopy}
          rows={csvCleanPreviewRows}
          tCsv={tCsv}
          title={tCsv.cleanOutput}
        />
      </section>

      <label className="output-box csv-output-box">
        <span>{tCsv.cleanOutput}</span>
        <textarea readOnly value={csvReport.cleaned} />
      </label>
    </section>
  )
}
