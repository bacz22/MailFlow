import { apiClient, getAccessToken } from './apiClient'
import type { Contact, ContactStatus } from '../types/contact.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

export interface ContactCustomField {
  key: string
  value: string
}

export interface ContactStats {
  total: number
  active: number
  unsubscribed: number
  bounced: number
  invalid: number
  blocked: number
}

export interface ContactPageResult {
  content: Contact[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  availableTags: string[]
}

export interface ContactListParams {
  q?: string
  status?: string
  tag?: string
  page?: number
  size?: number
  sort?: string
}

export interface UpsertContactPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  status?: ContactStatus
  tags?: string[]
  customFields?: ContactCustomField[]
}

export interface ImportContactRow {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  customFields?: ContactCustomField[]
}

export interface ImportContactsPayload {
  duplicateAction: 'SKIP' | 'UPDATE'
  skipInvalid?: boolean
  tags?: string[]
  rows: ImportContactRow[]
}

export interface ImportContactsResult {
  created: number
  updated: number
  skipped: number
  invalid: number
  errors: Array<{ row: number; email: string; reason: string }>
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
]

function avatarColorFromId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]
}

function formatContactDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function mapContact(raw: Record<string, unknown>): Contact {
  const id = String(raw.id ?? '')
  return {
    id,
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    fullName: String(raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    company: raw.company ? String(raw.company) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    lists: Array.isArray(raw.lists) ? raw.lists.map(String) : [],
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    status: (raw.status as ContactStatus) ?? 'active',
    customFields: Array.isArray(raw.customFields)
      ? (raw.customFields as ContactCustomField[])
      : [],
    createdAt: formatContactDate(raw.createdAt as string | undefined),
    updatedAt: formatContactDate(raw.updatedAt as string | undefined),
    avatarColor: avatarColorFromId(id),
  }
}

function buildQuery(params: ContactListParams): string {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.status && params.status !== 'all') search.set('status', params.status)
  if (params.tag && params.tag !== 'all') search.set('tag', params.tag)
  if (params.page != null) search.set('page', String(params.page))
  if (params.size != null) search.set('size', String(params.size))
  if (params.sort) search.set('sort', params.sort)
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function downloadCsv(endpoint: string, filename: string, options: RequestInit = {}): Promise<void> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers: Record<string, string> = {
    Accept: 'text/csv',
  }
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  })
  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export const contactService = {
  async list(params: ContactListParams = {}): Promise<ContactPageResult> {
    const data = await apiClient<{
      content: Record<string, unknown>[]
      page: number
      size: number
      totalElements: number
      totalPages: number
      availableTags?: string[]
    }>(`/contacts${buildQuery(params)}`, { method: 'GET' })

    return {
      content: data.content.map(mapContact),
      page: data.page,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      availableTags: data.availableTags ?? [],
    }
  },

  async stats(): Promise<ContactStats> {
    return apiClient<ContactStats>('/contacts/stats', { method: 'GET' })
  },

  async get(contactId: string): Promise<Contact> {
    const data = await apiClient<Record<string, unknown>>(`/contacts/${contactId}`, { method: 'GET' })
    return mapContact(data)
  },

  async create(payload: UpsertContactPayload): Promise<Contact> {
    const data = await apiClient<Record<string, unknown>>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapContact(data)
  },

  async update(contactId: string, payload: Partial<UpsertContactPayload>): Promise<Contact> {
    const data = await apiClient<Record<string, unknown>>(`/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapContact(data)
  },

  async delete(contactId: string): Promise<void> {
    await apiClient<void>(`/contacts/${contactId}`, { method: 'DELETE' })
  },

  async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    return apiClient<{ deleted: number }>('/contacts/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  async bulkTags(ids: string[], tags: string[]): Promise<{ updated: number }> {
    return apiClient<{ updated: number }>('/contacts/bulk-tags', {
      method: 'POST',
      body: JSON.stringify({ ids, tags }),
    })
  },

  async import(payload: ImportContactsPayload): Promise<ImportContactsResult> {
    return apiClient<ImportContactsResult>('/contacts/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async exportFiltered(params: ContactListParams = {}): Promise<void> {
    await downloadCsv(`/contacts/export${buildQuery(params)}`, 'contacts_export.csv', { method: 'GET' })
  },

  async exportSelected(ids: string[]): Promise<void> {
    await downloadCsv('/contacts/export', 'contacts_selected_export.csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  },
}
