import { apiClient } from './apiClient'
import { mapContact, type ContactPageResult } from './contact.service'
import type { DynamicSegment, MatchLogic, SegmentCondition } from '../types/segment.types'

function formatSegmentDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function mapSegment(raw: Record<string, unknown>): DynamicSegment {
  const matchLogicRaw = String(raw.matchLogic ?? 'and').toLowerCase()
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    matchLogic: (matchLogicRaw === 'or' ? 'or' : 'and') as MatchLogic,
    conditions: Array.isArray(raw.conditions)
      ? (raw.conditions as SegmentCondition[]).map((c) => ({
          id: String(c.id ?? `c-${Math.random()}`),
          field: String(c.field ?? ''),
          operator: String(c.operator ?? ''),
          value: String(c.value ?? ''),
          fieldType: (c.fieldType as SegmentCondition['fieldType']) || 'string',
        }))
      : [],
    contactCount: Number(raw.contactCount ?? 0),
    createdAt: formatSegmentDate(raw.createdAt as string | undefined),
    updatedAt: formatSegmentDate(raw.updatedAt as string | undefined),
  }
}

export interface UpsertSegmentPayload {
  name: string
  description?: string
  matchLogic: MatchLogic
  conditions: SegmentCondition[]
}

export const segmentService = {
  async list(q?: string): Promise<DynamicSegment[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    const rows = await apiClient<Record<string, unknown>[]>(`/segments${query}`, { method: 'GET' })
    return rows.map(mapSegment)
  },

  async get(segmentId: string): Promise<DynamicSegment> {
    const data = await apiClient<Record<string, unknown>>(`/segments/${segmentId}`, { method: 'GET' })
    return mapSegment(data)
  },

  async create(payload: UpsertSegmentPayload): Promise<DynamicSegment> {
    const data = await apiClient<Record<string, unknown>>('/segments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapSegment(data)
  },

  async update(segmentId: string, payload: Partial<UpsertSegmentPayload>): Promise<DynamicSegment> {
    const data = await apiClient<Record<string, unknown>>(`/segments/${segmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapSegment(data)
  },

  async delete(segmentId: string): Promise<void> {
    await apiClient<void>(`/segments/${segmentId}`, { method: 'DELETE' })
  },

  async duplicate(segmentId: string): Promise<DynamicSegment> {
    const data = await apiClient<Record<string, unknown>>(`/segments/${segmentId}/duplicate`, {
      method: 'POST',
    })
    return mapSegment(data)
  },

  async listContacts(
    segmentId: string,
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
    }>(`/segments/${segmentId}/contacts${query}`, { method: 'GET' })
    return {
      content: (data.content ?? []).map(mapContact),
      page: Number(data.page ?? 0),
      size: Number(data.size ?? 10),
      totalElements: Number(data.totalElements ?? 0),
      totalPages: Number(data.totalPages ?? 0),
      availableTags: Array.isArray(data.availableTags) ? data.availableTags.map(String) : [],
    }
  },

  async preview(payload: {
    matchLogic: MatchLogic
    conditions: SegmentCondition[]
    page?: number
    size?: number
  }): Promise<ContactPageResult> {
    const data = await apiClient<{
      content: Record<string, unknown>[]
      page: number
      size: number
      totalElements: number
      totalPages: number
      availableTags?: string[]
    }>('/segments/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return {
      content: (data.content ?? []).map(mapContact),
      page: Number(data.page ?? 0),
      size: Number(data.size ?? 10),
      totalElements: Number(data.totalElements ?? 0),
      totalPages: Number(data.totalPages ?? 0),
      availableTags: Array.isArray(data.availableTags) ? data.availableTags.map(String) : [],
    }
  },
}
