import { apiClient } from './apiClient'
import type { AudienceTag } from '../types/list.types'

function formatTagDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function mapTag(raw: Record<string, unknown>): AudienceTag {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    color: String(raw.color ?? ''),
    contactCount: Number(raw.contactCount ?? 0),
    createdAt: formatTagDate(raw.createdAt as string | undefined),
  }
}

export const tagService = {
  async list(q?: string): Promise<AudienceTag[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    const rows = await apiClient<Record<string, unknown>[]>(`/tags${query}`, { method: 'GET' })
    return rows.map(mapTag)
  },

  async create(payload: { name: string; color?: string }): Promise<AudienceTag> {
    const data = await apiClient<Record<string, unknown>>('/tags', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapTag(data)
  },

  async update(tagId: string, payload: { name?: string; color?: string }): Promise<AudienceTag> {
    const data = await apiClient<Record<string, unknown>>(`/tags/${tagId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapTag(data)
  },

  async delete(tagId: string): Promise<void> {
    await apiClient<void>(`/tags/${tagId}`, { method: 'DELETE' })
  },

  async syncFromContacts(): Promise<{ created: number; tags: AudienceTag[] }> {
    const data = await apiClient<{ created: number; tags: Record<string, unknown>[] }>(
      '/tags/sync-from-contacts',
      { method: 'POST' }
    )
    return {
      created: Number(data.created ?? 0),
      tags: Array.isArray(data.tags) ? data.tags.map(mapTag) : [],
    }
  },
}
