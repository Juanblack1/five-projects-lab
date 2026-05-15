import type { Language } from '../../hooks/useLanguagePreference'

export const CSV_PREVIEW_LIMIT = 50
export const MAX_CSV_FILE_SIZE = 2 * 1024 * 1024

export type CsvCleanOptions = {
  normalizeHeaders: boolean
  removeDuplicates: boolean
  removeEmptyRows: boolean
  trimCells: boolean
}

export type CsvColumnStat = {
  filled: number
  header: string
  missing: number
  unique: number
}

export type CsvFileMeta = {
  name: string
  size: number
  type: string
}

export type CsvIssueKey =
  | 'duplicateRows'
  | 'emptyCells'
  | 'emptyRows'
  | 'inconsistentRows'
  | 'unnamedColumns'

export type CsvIssue = {
  count: number
  key: CsvIssueKey
}

export type CsvReport = {
  cleaned: string
  cleanedHeaders: string[]
  cleanedRows: string[][]
  columnCount: number
  columnStats: CsvColumnStat[]
  duplicateRows: number
  emptyCells: number
  emptyRows: number
  inconsistentRows: number
  issues: CsvIssue[]
  parseError: string
  quality: number
  rawHeaders: string[]
  rawRows: string[][]
  rowCount: number
  unnamedColumns: number
}

export const defaultCsvCleanOptions: CsvCleanOptions = {
  normalizeHeaders: true,
  removeDuplicates: true,
  removeEmptyRows: true,
  trimCells: true,
}

export const sampleCsvByLanguage: Record<Language, string> = {
  'pt-BR': `nome, trilha, status, 
Ana, Frontend, concluido, ativa
Bruno, Backend, , ativo
Ana, Frontend, concluido, ativa
Clara, Dados, revisao, ativo
, Operacoes, pendente, inativo
Linha vazia,,,
`,
  en: `name, track, status, 
Ana, Frontend, done, active
Bruno, Backend, , active
Ana, Frontend, done, active
Clara, Data, review, active
, Operations, pending, inactive
Empty row,,,
`,
}

type CsvParseResult = {
  error: string
  rows: string[][]
}

function parseCsvRows(input: string): CsvParseResult {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let error = ''

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const next = input[index + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"' && cell.trim().length === 0) {
      quoted = true
      continue
    }

    if (char === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    if (char === '\r') {
      if (next === '\n') {
        continue
      }
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  if (quoted) {
    error = 'unclosed-quote'
  }

  row.push(cell)
  rows.push(row)

  return {
    error,
    rows: rows.filter((cells, index) => index < rows.length - 1 || cells.some((cellValue) => cellValue.length > 0)),
  }
}

function normalizeRow(row: string[], length: number) {
  return Array.from({ length }, (_, index) => row[index] ?? '')
}

function isEmptyRow(row: string[]) {
  return row.every((cell) => cell.trim().length === 0)
}

function makeDuplicateKey(row: string[]) {
  return row.map((cell) => cell.trim().toLowerCase()).join('\u001f')
}

function normalizeHeaderValue(header: string, index: number) {
  const normalized = header
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized || `column_${index + 1}`
}

function normalizeHeaders(headers: string[]) {
  const seen = new Map<string, number>()

  return headers.map((header, index) => {
    const base = normalizeHeaderValue(header, index)
    const nextCount = (seen.get(base) ?? 0) + 1
    seen.set(base, nextCount)
    return nextCount === 1 ? base : `${base}_${nextCount}`
  })
}

function stringifyCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\r\n]/.test(cell)) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        })
        .join(','),
    )
    .join('\n')
}

function getColumnCount(rows: string[][]) {
  return rows.reduce((largest, row) => Math.max(largest, row.length), 0)
}

function buildIssues(report: Omit<CsvReport, 'issues'>): CsvIssue[] {
  const issues: CsvIssue[] = [
    { count: report.emptyCells, key: 'emptyCells' },
    { count: report.duplicateRows, key: 'duplicateRows' },
    { count: report.unnamedColumns, key: 'unnamedColumns' },
    { count: report.inconsistentRows, key: 'inconsistentRows' },
    { count: report.emptyRows, key: 'emptyRows' },
  ]

  return issues.filter((issue) => issue.count > 0)
}

function getQualityScore(report: {
  duplicateRows: number
  emptyCells: number
  emptyRows: number
  inconsistentRows: number
  unnamedColumns: number
}) {
  return Math.max(
    0,
    Math.min(
      100,
      100 -
        report.emptyCells * 4 -
        report.duplicateRows * 12 -
        report.unnamedColumns * 12 -
        report.inconsistentRows * 10 -
        report.emptyRows * 8,
    ),
  )
}

export function analyzeCsv(input: string, options: CsvCleanOptions = defaultCsvCleanOptions): CsvReport {
  const parsed = parseCsvRows(input)
  const columnCount = getColumnCount(parsed.rows)

  if (!input.trim() || parsed.rows.length === 0 || columnCount === 0) {
    return {
      cleaned: '',
      cleanedHeaders: [],
      cleanedRows: [],
      columnCount: 0,
      columnStats: [],
      duplicateRows: 0,
      emptyCells: 0,
      emptyRows: 0,
      inconsistentRows: 0,
      issues: [],
      parseError: parsed.error,
      quality: 0,
      rawHeaders: [],
      rawRows: [],
      rowCount: 0,
      unnamedColumns: 0,
    }
  }

  const rawHeaders = normalizeRow(parsed.rows[0], columnCount)
  const rawRows = parsed.rows.slice(1).map((row) => normalizeRow(row, columnCount))
  const bodySourceRows = parsed.rows.slice(1)
  const rowCount = rawRows.length
  const emptyRows = rawRows.filter(isEmptyRow).length
  const unnamedColumns = rawHeaders.filter((header) => header.trim().length === 0).length
  const inconsistentRows = bodySourceRows.filter((row) => row.length !== parsed.rows[0].length).length
  const emptyCells = rawRows.reduce(
    (total, row) => total + row.filter((cell) => cell.trim().length === 0).length,
    0,
  )
  const seen = new Set<string>()
  let duplicateRows = 0

  for (const row of rawRows) {
    if (isEmptyRow(row)) continue
    const key = makeDuplicateKey(row)
    if (seen.has(key)) {
      duplicateRows += 1
    } else {
      seen.add(key)
    }
  }

  const columnStats = rawHeaders.map((header, index) => {
    const values = rawRows.map((row) => row[index] ?? '')
    const filled = values.filter((value) => value.trim().length > 0)
    return {
      filled: filled.length,
      header,
      missing: values.length - filled.length,
      unique: new Set(filled.map((value) => value.trim().toLowerCase())).size,
    }
  })

  const cleanedHeaders = options.normalizeHeaders
    ? normalizeHeaders(rawHeaders)
    : rawHeaders.map((header) => (options.trimCells ? header.trim() : header))
  let cleanedRows = rawRows.map((row) =>
    options.trimCells ? row.map((cell) => cell.trim().replace(/\s+/g, ' ')) : [...row],
  )

  if (options.removeEmptyRows) {
    cleanedRows = cleanedRows.filter((row) => !isEmptyRow(row))
  }

  if (options.removeDuplicates) {
    const cleanSeen = new Set<string>()
    cleanedRows = cleanedRows.filter((row) => {
      const key = makeDuplicateKey(row)
      if (cleanSeen.has(key)) return false
      cleanSeen.add(key)
      return true
    })
  }

  const reportBase = {
    cleaned: stringifyCsv([cleanedHeaders, ...cleanedRows]),
    cleanedHeaders,
    cleanedRows,
    columnCount,
    columnStats,
    duplicateRows,
    emptyCells,
    emptyRows,
    inconsistentRows,
    parseError: parsed.error,
    quality: getQualityScore({
      duplicateRows,
      emptyCells,
      emptyRows,
      inconsistentRows,
      unnamedColumns,
    }),
    rawHeaders,
    rawRows,
    rowCount,
    unnamedColumns,
  }

  return {
    ...reportBase,
    issues: buildIssues(reportBase),
  }
}

export function getPreviewRows(rows: string[][], filter: string) {
  const filterText = filter.trim().toLowerCase()
  const visibleRows = filterText
    ? rows.filter((row) => row.join(' ').toLowerCase().includes(filterText))
    : rows

  return visibleRows.slice(0, CSV_PREVIEW_LIMIT)
}

export function getFileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function isAcceptedCsvFile(file: File) {
  const extension = getFileExtension(file.name)
  return extension === 'csv' || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel'
}

export function getCleanedCsvFileName(meta: CsvFileMeta | null) {
  if (!meta) return 'cleaned-data.csv'
  return `${meta.name.replace(/\.csv$/i, '')}-cleaned.csv`
}
