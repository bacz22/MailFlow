import { apiClient } from './apiClient'
import type { AudienceList } from '../types/list.types'
import { mapContact, type ContactPageResult } from './contact.service'

function formatListDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function mapList(raw: Record<string, unknown>): AudienceList {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    contactCount: Number(raw.contactCount ?? 0),
    activeCount: Number(raw.activeCount ?? 0),
    unsubscribedCount: Number(raw.unsubscribedCount ?? 0),
    createdAt: formatListDate(raw.createdAt as string | undefined),
    updatedAt: formatListDate(raw.updatedAt as string | undefined),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  }
}

export const listService = {
  async list(q?: string): Promise<AudienceList[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    const rows = await apiClient<Record<string, unknown>[]>(`/lists${query}`, { method: 'GET' })
    return rows.map(mapList)
  },

  async get(listId: string): Promise<AudienceList> {
    const data = await apiClient<Record<string, unknown>>(`/lists/${listId}`, { method: 'GET' })
    return mapList(data)
  },

  async create(payload: { name: string; description?: string; tags?: string[] }): Promise<AudienceList> {
    const data = await apiClient<Record<string, unknown>>('/lists', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapList(data)
  },

  async update(
    listId: string,
    payload: { name?: string; description?: string; tags?: string[] }
  ): Promise<AudienceList> {
    const data = await apiClient<Record<string, unknown>>(`/lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapList(data)
  },

  async delete(listId: string): Promise<void> {
    await apiClient<void>(`/lists/${listId}`, { method: 'DELETE' })
  },

  async duplicate(listId: string): Promise<AudienceList> {
    const data = await apiClient<Record<string, unknown>>(`/lists/${listId}/duplicate`, { method: 'POST' })
    return mapList(data)
  },

  async listContacts(
    listId: string,
    params: { q?: string; status?: string; page?: number; size?: number } = {}
  ): Promise<ContactPageResult> {
    const search = new URLSearchParams()
    if (params.q) search.set('q', params.q)
    if (params.status && params.status !== 'all') search.set('status', params.status)
    if (params.page != null) search.set('page', String(params.page))
    if (params.size != null) search.set('size', String(params.size))
    const query = search.toString() ? `?${search.toString()}` : ''
    const data = await apiClient<{
      content: Record<string, unknown>[]
      page: number
      size: number
      totalElements: number
      totalPages: number
      availableTags?: string[]
    }>(`/lists/${listId}/contacts${query}`, { method: 'GET' })

    return {
      content: data.content.map(mapContact),
      page: data.page,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      availableTags: data.availableTags ?? [],
    }
  },

  async addMembers(listId: string, ids: string[]): Promise<{ added: number }> {
    return apiClient<{ added: number }>(`/lists/${listId}/members`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  async removeMember(listId: string, contactId: string): Promise<void> {
    await apiClient<void>(`/lists/${listId}/members/${contactId}`, { method: 'DELETE' })
  },
}

