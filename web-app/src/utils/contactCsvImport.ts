import type { ImportContactRow } from '../services/contact.service'

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

export function analyzeImportRows(rows: ImportContactRow[]) {
  let valid = 0
  let invalid = 0
  let missingEmail = 0

  rows.forEach((row) => {
    const email = row.email?.trim() ?? ''
    if (!email) {
      missingEmail += 1
      invalid += 1
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      invalid += 1
      return
    }
    valid += 1
  })

  return {
    total: rows.length,
    valid,
    invalid,
    missingEmail,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
