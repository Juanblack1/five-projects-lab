import { useMemo, useState } from 'react'
import type { Language } from '../../hooks/useLanguagePreference'
import type { CopyState } from '../../shared/types'
import {
  MAX_CSV_FILE_SIZE,
  analyzeCsv,
  defaultCsvCleanOptions,
  getCleanedCsvFileName,
  getPreviewRows,
  isAcceptedCsvFile,
  sampleCsvByLanguage,
  type CsvCleanOptions,
  type CsvFileMeta,
} from './csvModel'

type CsvHookCopy = {
  cleanedApplied: string
  fileInvalid: string
  fileReadError: string
  fileTooLarge: (limit: string) => string
  sampleLoaded: string
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

export function useCsvModule(language: Language, tCsv: CsvHookCopy, locale: string) {
  const [csvInput, setCsvInput] = useState(sampleCsvByLanguage[language])
  const [csvFilter, setCsvFilter] = useState('')
  const [csvFind, setCsvFind] = useState('')
  const [csvReplace, setCsvReplace] = useState('')
  const [csvCopyStatus, setCsvCopyStatus] = useState<CopyState>('idle')
  const [csvCleanOptions, setCsvCleanOptions] = useState<CsvCleanOptions>(defaultCsvCleanOptions)
  const [csvFileMeta, setCsvFileMeta] = useState<CsvFileMeta | null>(null)
  const [csvFileError, setCsvFileError] = useState('')
  const [csvActionMessage, setCsvActionMessage] = useState('')

  const csvReport = useMemo(() => analyzeCsv(csvInput, csvCleanOptions), [csvCleanOptions, csvInput])
  const csvPreviewRows = useMemo(
    () => getPreviewRows(csvReport.rawRows, csvFilter),
    [csvFilter, csvReport.rawRows],
  )
  const csvCleanPreviewRows = useMemo(
    () => getPreviewRows(csvReport.cleanedRows, csvFilter),
    [csvFilter, csvReport.cleanedRows],
  )
  const csvPreviewLimited = csvReport.rawRows.length > csvPreviewRows.length
  const csvCleanPreviewLimited = csvReport.cleanedRows.length > csvCleanPreviewRows.length
  const csvQuality = csvReport.quality
  const csvCleanedFileName = getCleanedCsvFileName(csvFileMeta)

  function setCsvCleanOption(option: keyof CsvCleanOptions, value: boolean) {
    setCsvCleanOptions((current) => ({ ...current, [option]: value }))
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

  function normalizeCsvHeaders() {
    const normalized = analyzeCsv(csvInput, {
      normalizeHeaders: true,
      removeDuplicates: false,
      removeEmptyRows: false,
      trimCells: false,
    })
    if (!normalized.cleaned) return
    const rows = normalized.cleaned.split('\n')
    const originalRows = csvInput.split(/\r?\n/)
    setCsvInput([rows[0], ...originalRows.slice(1)].join('\n'))
    setCsvActionMessage(tCsv.cleanedApplied)
  }

  function applyCsvReplace() {
    if (!csvFind) return
    setCsvInput((current) => current.split(csvFind).join(csvReplace))
    setCsvActionMessage(tCsv.cleanedApplied)
  }

  function applyCsvClean() {
    if (!csvReport.cleaned) return
    setCsvInput(csvReport.cleaned)
    setCsvFileMeta((current) =>
      current ? { ...current, name: getCleanedCsvFileName(current), size: csvReport.cleaned.length } : current,
    )
    setCsvActionMessage(tCsv.cleanedApplied)
  }

  async function handleCsvFile(file: File | null) {
    setCsvCopyStatus('idle')
    setCsvActionMessage('')

    if (!file) return

    if (!isAcceptedCsvFile(file)) {
      setCsvFileError(tCsv.fileInvalid)
      return
    }

    if (file.size > MAX_CSV_FILE_SIZE) {
      setCsvFileError(tCsv.fileTooLarge(formatBytes(MAX_CSV_FILE_SIZE, locale)))
      return
    }

    try {
      const text = await file.text()
      setCsvInput(text)
      setCsvFileMeta({ name: file.name, size: file.size, type: file.type || 'text/csv' })
      setCsvFileError('')
      setCsvActionMessage(file.name)
    } catch {
      setCsvFileError(tCsv.fileReadError)
    }
  }

  function loadSampleCsv() {
    setCsvInput(sampleCsvByLanguage[language])
    setCsvFileMeta(null)
    setCsvFileError('')
    setCsvCopyStatus('idle')
    setCsvActionMessage(tCsv.sampleLoaded)
  }

  return {
    applyCsvClean,
    applyCsvReplace,
    copyCleanCsv,
    csvActionMessage,
    csvCleanOptions,
    csvCleanPreviewLimited,
    csvCleanPreviewRows,
    csvCleanedFileName,
    csvColumnStats: csvReport.columnStats,
    csvCopyStatus,
    csvFileError,
    csvFileMeta,
    csvFilter,
    csvFind,
    csvHeaders: csvReport.rawHeaders,
    csvInput,
    csvPreviewLimited,
    csvPreviewRows,
    csvQuality,
    csvReplace,
    csvReport,
    formatCsvBytes: (bytes: number) => formatBytes(bytes, locale),
    handleCsvFile,
    loadSampleCsv,
    normalizeCsvHeaders,
    setCsvCleanOption,
    setCsvCopyStatus,
    setCsvFilter,
    setCsvFind,
    setCsvInput,
    setCsvReplace,
  }
}
