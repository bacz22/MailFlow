import { apiClient } from './apiClient'
import type { Campaign, CampaignStatus } from '../types/campaign.types'

const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'QUEUED',
  'SENDING',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
  'REJECTED',
]

function formatCampaignDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function mapStatus(raw: unknown): CampaignStatus {
  const status = String(raw ?? 'DRAFT').toUpperCase() as CampaignStatus
  return CAMPAIGN_STATUSES.includes(status) ? status : 'DRAFT'
}

export interface NamedAudienceRef {
  id: string
  name: string
}

export interface CampaignDetail extends Campaign {
  previewText?: string
  senderId?: string
  senderName?: string
  senderEmail?: string
  replyTo?: string
  templateId?: string
  htmlContent?: string
  sendType?: 'immediate' | 'scheduled'
  scheduledAtIso?: string
  reviewNote?: string
  submittedAt?: string
  reviewedAt?: string
  lists: NamedAudienceRef[]
  segments: NamedAudienceRef[]
  excludedLists: NamedAudienceRef[]
  listIds: string[]
  segmentIds: string[]
  excludedListIds: string[]
}

export type CampaignWritePayload = {
  name: string
  subject: string
  previewText?: string
  senderId?: string
  replyTo?: string
  templateId?: string
  htmlContent?: string
  sendType?: 'immediate' | 'scheduled'
  scheduledAt?: string
  listIds?: string[]
  segmentIds?: string[]
  excludedListIds?: string[]
}

function asNamedAudience(value: unknown): NamedAudienceRef[] {
  if (!Array.isArray(value)) return []
  return value.map((row) => {
    const item = row as Record<string, unknown>
    return {
      id: String(item.id ?? ''),
      name: String(item.name ?? '—'),
    }
  })
}

function mapCampaign(raw: Record<string, unknown>): CampaignDetail {
  const audienceType = raw.audienceType === 'segment' ? 'segment' : 'list'
  const lists = asNamedAudience(raw.lists)
  const segments = asNamedAudience(raw.segments)
  const excludedLists = asNamedAudience(raw.excludedLists)
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    subject: String(raw.subject ?? ''),
    status: mapStatus(raw.status),
    audienceName: String(raw.audienceName ?? '—'),
    audienceType,
    recipientCount: Number(raw.recipientCount ?? 0),
    sentCount: Number(raw.sentCount ?? 0),
    openRate: Number(raw.openRate ?? 0),
    clickRate: Number(raw.clickRate ?? 0),
    scheduledAt: raw.scheduledAt ? formatCampaignDate(raw.scheduledAt as string) : undefined,
    scheduledAtIso: raw.scheduledAt ? String(raw.scheduledAt) : undefined,
    sentAt: raw.sentAt ? formatCampaignDate(raw.sentAt as string) : undefined,
    createdBy: String(raw.createdBy ?? '—'),
    createdAt: formatCampaignDate(raw.createdAt as string | undefined),
    updatedAt: formatCampaignDate(raw.updatedAt as string | undefined),
    previewText: raw.previewText ? String(raw.previewText) : undefined,
    senderId: raw.senderId ? String(raw.senderId) : undefined,
    senderName: raw.senderName ? String(raw.senderName) : undefined,
    senderEmail: raw.senderEmail ? String(raw.senderEmail) : undefined,
    replyTo: raw.replyTo ? String(raw.replyTo) : undefined,
    templateId: raw.templateId ? String(raw.templateId) : undefined,
    htmlContent: raw.htmlContent != null ? String(raw.htmlContent) : '',
    sendType: raw.sendType === 'scheduled' ? 'scheduled' : 'immediate',
    reviewNote: raw.reviewNote ? String(raw.reviewNote) : undefined,
    submittedAt: raw.submittedAt ? formatCampaignDate(raw.submittedAt as string) : undefined,
    reviewedAt: raw.reviewedAt ? formatCampaignDate(raw.reviewedAt as string) : undefined,
    lists,
    segments,
    excludedLists,
    listIds: lists.length ? lists.map((l) => l.id) : asStringArray(raw.listIds),
    segmentIds: segments.length ? segments.map((s) => s.id) : asStringArray(raw.segmentIds),
    excludedListIds: excludedLists.length
      ? excludedLists.map((l) => l.id)
      : asStringArray(raw.excludedListIds),
  }
}

export const campaignService = {
  async list(params?: { q?: string; status?: string }): Promise<CampaignDetail[]> {
    const search = new URLSearchParams()
    if (params?.q) search.set('q', params.q)
    if (params?.status && params.status !== 'all') search.set('status', params.status)
    const query = search.toString() ? `?${search.toString()}` : ''
    const rows = await apiClient<Record<string, unknown>[]>(`/campaigns${query}`, { method: 'GET' })
    return rows.map(mapCampaign)
  },

  async get(campaignId: string): Promise<CampaignDetail> {
    const data = await apiClient<Record<string, unknown>>(`/campaigns/${campaignId}`, { method: 'GET' })
    return mapCampaign(data)
  },

  async create(payload: CampaignWritePayload): Promise<CampaignDetail> {
    const data = await apiClient<Record<string, unknown>>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapCampaign(data)
  },

  async update(campaignId: string, payload: CampaignWritePayload): Promise<CampaignDetail> {
    const data = await apiClient<Record<string, unknown>>(`/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapCampaign(data)
  },

  async delete(campaignId: string): Promise<void> {
    await apiClient<void>(`/campaigns/${campaignId}`, { method: 'DELETE' })
  },

  async submit(campaignId: string): Promise<CampaignDetail> {
    const data = await apiClient<Record<string, unknown>>(`/campaigns/${campaignId}/submit`, {
      method: 'POST',
    })
    return mapCampaign(data)
  },

  async approve(campaignId: string, note?: string): Promise<CampaignDetail> {
    const data = await apiClient<Record<string, unknown>>(`/campaigns/${campaignId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    })
    return mapCampaign(data)
  },

  async reject(campaignId: string, note: string): Promise<CampaignDetail> {
    const data = await apiClient<Record<string, unknown>>(`/campaigns/${campaignId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    })
    return mapCampaign(data)
  },

  async cancel(campaignId: string): Promise<CampaignDetail> {
    const data = await apiClient<Record<string, unknown>>(`/campaigns/${campaignId}/cancel`, {
      method: 'POST',
    })
    return mapCampaign(data)
  },

  async sendTest(
    campaignId: string,
    payload: { to: string; firstName?: string; lastName?: string; company?: string; phone?: string }
  ): Promise<void> {
    await apiClient<void>(`/campaigns/${campaignId}/send-test`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
