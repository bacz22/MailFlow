import { apiClient } from './apiClient'
import type { EmailTemplate, TemplateStatus } from '../types/template.types'

function formatTemplateDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function mapTemplate(raw: Record<string, unknown>): EmailTemplate {
  const statusRaw = String(raw.status ?? 'draft').toLowerCase()
  const status: TemplateStatus =
    statusRaw === 'published' || statusRaw === 'archived' || statusRaw === 'draft'
      ? statusRaw
      : 'draft'
  const category = String(raw.category ?? 'Newsletter') as EmailTemplate['category']
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    subject: String(raw.subject ?? ''),
    previewText: raw.previewText ? String(raw.previewText) : undefined,
    category,
    status,
    createdBy: String(raw.createdBy ?? '—'),
    createdAt: formatTemplateDate(raw.createdAt as string | undefined),
    updatedAt: formatTemplateDate(raw.updatedAt as string | undefined),
    htmlContent: String(raw.htmlContent ?? ''),
    thumbnailGradient: raw.thumbnailGradient ? String(raw.thumbnailGradient) : undefined,
    bannerLabel: raw.bannerLabel != null ? String(raw.bannerLabel) : undefined,
    bannerTitle: raw.bannerTitle != null ? String(raw.bannerTitle) : undefined,
  }
}

export type TemplateWritePayload = {
  name: string
  subject: string
  previewText?: string
  category: EmailTemplate['category']
  status?: TemplateStatus
  htmlContent: string
  thumbnailGradient?: string
  bannerLabel?: string
  bannerTitle?: string
}

export const templateService = {
  async list(params?: { q?: string; status?: string; category?: string }): Promise<EmailTemplate[]> {
    const search = new URLSearchParams()
    if (params?.q) search.set('q', params.q)
    if (params?.status && params.status !== 'all') search.set('status', params.status)
    if (params?.category && params.category !== 'all') search.set('category', params.category)
    const query = search.toString() ? `?${search.toString()}` : ''
    const rows = await apiClient<Record<string, unknown>[]>(`/templates${query}`, { method: 'GET' })
    return rows.map(mapTemplate)
  },

  async get(templateId: string): Promise<EmailTemplate> {
    const data = await apiClient<Record<string, unknown>>(`/templates/${templateId}`, { method: 'GET' })
    return mapTemplate(data)
  },

  async create(payload: TemplateWritePayload): Promise<EmailTemplate> {
    const data = await apiClient<Record<string, unknown>>('/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapTemplate(data)
  },

  async update(templateId: string, payload: Partial<TemplateWritePayload>): Promise<EmailTemplate> {
    const data = await apiClient<Record<string, unknown>>(`/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapTemplate(data)
  },

  async delete(templateId: string): Promise<void> {
    await apiClient<void>(`/templates/${templateId}`, { method: 'DELETE' })
  },

  async duplicate(templateId: string): Promise<EmailTemplate> {
    const data = await apiClient<Record<string, unknown>>(`/templates/${templateId}/duplicate`, {
      method: 'POST',
    })
    return mapTemplate(data)
  },

  async sendTest(
    templateId: string,
    payload: { to: string; firstName?: string; lastName?: string; company?: string; phone?: string }
  ): Promise<void> {
    await apiClient<void>(`/templates/${templateId}/send-test`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
