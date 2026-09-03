import type { ImportContactRow } from '../services/contact.service'
import * as XLSX from 'xlsx'

export interface ParsedCsvFile {
  headers: string[]
  rows: string[][]
}

export interface ColumnMapping {
  csvHeader: string
  sampleValue: string
  targetField: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function guessTargetField(header: string): string {
  const normalized = header.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (normalized.includes('email')) return 'email'
  if (normalized === 'first_name' || normalized === 'firstname' || normalized === 'given_name') {
    return 'firstName'
  }
  if (normalized === 'last_name' || normalized === 'lastname' || normalized === 'surname') {
    return 'lastName'
  }
  if (normalized.includes('full_name') || normalized === 'name') return 'fullName'
  if (normalized.includes('company') || normalized.includes('organization')) return 'company'
  if (normalized.includes('phone') || normalized.includes('mobile')) return 'phone'
  if (normalized.includes('job') || normalized.includes('title') || normalized.includes('position')) {
    return 'custom_job_title'
  }
  if (normalized.includes('city') || normalized.includes('location')) return 'custom_city'
  return 'skip'
}

export function parseCsvText(text: string): ParsedCsvFile {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = splitCsvLine(lines[0])
  const rows = lines.slice(1).map(splitCsvLine)
  return { headers, rows }
}

function normalizeSheetMatrix(matrix: unknown[][]): ParsedCsvFile {
  if (!matrix.length) {
    return { headers: [], rows: [] }
  }

  const headers = (matrix[0] ?? []).map((cell) => String(cell ?? '').trim())
  while (headers.length > 0 && headers[headers.length - 1] === '') {
    headers.pop()
  }
  if (headers.length === 0) {
    return { headers: [], rows: [] }
  }

  const rows = matrix
    .slice(1)
    .map((row) => headers.map((_, index) => String((row as unknown[])[index] ?? '').trim()))
    .filter((row) => row.some((cell) => cell.length > 0))

  return { headers, rows }
}

/** Parse SpreadsheetML / XLS / XLSX into the same shape as CSV. */
export function parseExcelArrayBuffer(buffer: ArrayBuffer): ParsedCsvFile {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: false })
  const preferred =
    workbook.SheetNames.find((name) => {
      const normalized = name.trim().toLowerCase()
      return normalized === 'danh ba' || normalized === 'contacts' || normalized === 'sheet1'
    }) ?? workbook.SheetNames.find((name) => !/huong dan|hướng dẫn|guide|readme/i.test(name))

  const sheetName = preferred ?? workbook.SheetNames[0]
  if (!sheetName) {
    return { headers: [], rows: [] }
  }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  }) as unknown[][]

  return normalizeSheetMatrix(matrix)
}

export async function parseContactImportFile(file: File): Promise<ParsedCsvFile> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) {
    return parseCsvText(await file.text())
  }
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
    return parseExcelArrayBuffer(await file.arrayBuffer())
  }
  throw new Error('Định dạng không hỗ trợ. Vui lòng dùng file .CSV, .XLS hoặc .XLSX.')
}

export function isSupportedContactImportFile(fileName: string): boolean {
  const name = fileName.toLowerCase()
  return name.endsWith('.csv') || name.endsWith('.xls') || name.endsWith('.xlsx')
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

export function buildMappings(parsed: ParsedCsvFile): ColumnMapping[] {
  const sampleRow = parsed.rows[0] ?? []
  return parsed.headers.map((header, index) => ({
    csvHeader: header,
    sampleValue: sampleRow[index] ?? '',
    targetField: guessTargetField(header),
  }))
}

export function mapRowsToImportPayload(
  parsed: ParsedCsvFile,
  mappings: ColumnMapping[]
): ImportContactRow[] {
  const fieldIndex = new Map<string, number>()
  mappings.forEach((mapping, index) => {
    if (mapping.targetField !== 'skip') {
      fieldIndex.set(mapping.targetField, index)
    }
  })

  return parsed.rows.map((row) => {
    const getValue = (field: string) => {
      const index = fieldIndex.get(field)
      return index == null ? '' : row[index] ?? ''
    }

    let firstName = getValue('firstName')
    let lastName = getValue('lastName')
    const fullName = getValue('fullName')
    if (!firstName && !lastName && fullName) {
      const parts = fullName.trim().split(/\s+/)
      if (parts.length > 1) {
        firstName = parts.pop() ?? ''
        lastName = parts.join(' ')
      } else {
        lastName = fullName
        firstName = '—'
      }
    }

    const customFields: Array<{ key: string; value: string }> = []
    mappings.forEach((mapping, index) => {
      if (mapping.targetField.startsWith('custom_')) {
        const key = mapping.targetField.replace(/^custom_/, '').replace(/_/g, ' ')
        customFields.push({
          key: key.charAt(0).toUpperCase() + key.slice(1),
          value: row[index] ?? '',
        })
      }
    })

    return {
      email: getValue('email').trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      company: getValue('company').trim() || undefined,
      phone: getValue('phone').trim() || undefined,
      customFields,
    }
  })
}

export interface DuplicateDetail {
  email: string
  rowNumber: number
  firstSeenRowNumber: number
}

export interface ImportAnalysis {
  total: number
  valid: number
  duplicates: number
  invalid: number
  missingEmail: number
  duplicateDetails: DuplicateDetail[]
}

export function analyzeImportRows(rows: ImportContactRow[]): ImportAnalysis {
  let missingEmail = 0
  let malformedEmail = 0
  const seenEmailRows = new Map<string, number>()
  const duplicateDetails: DuplicateDetail[] = []
  let duplicates = 0

  rows.forEach((row, index) => {
    const fileRowNumber = index + 2 // Row 1 is header row, data starts from Row 2
    const email = row.email?.trim().toLowerCase() ?? ''
    if (!email) {
      missingEmail += 1
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      malformedEmail += 1
      return
    }

    if (seenEmailRows.has(email)) {
      duplicates += 1
      duplicateDetails.push({
        email,
        rowNumber: fileRowNumber,
        firstSeenRowNumber: seenEmailRows.get(email)!,
      })
    } else {
      seenEmailRows.set(email, fileRowNumber)
    }
  })

  return {
    total: rows.length,
    valid: seenEmailRows.size,
    duplicates,
    invalid: missingEmail + malformedEmail,
    missingEmail,
    duplicateDetails,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
