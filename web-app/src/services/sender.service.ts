import { apiClient } from './apiClient'
import type { VerifiedSender, SenderVerificationStatus } from '../types/sender.types'

function formatSenderDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function mapSender(raw: Record<string, unknown>): VerifiedSender {
  const statusRaw = String(raw.status ?? 'FAILED').toUpperCase()
  const status: SenderVerificationStatus =
    statusRaw === 'VERIFIED' || statusRaw === 'PENDING' || statusRaw === 'FAILED'
      ? statusRaw
      : 'FAILED'
  const dkimRaw = String(raw.dkimStatus ?? 'pending')
  const spfRaw = String(raw.spfStatus ?? 'pending')
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    domain: String(raw.domain ?? ''),
    status,
    isVerified: Boolean(raw.isVerified),
    isDefault: Boolean(raw.isDefault),
    dkimStatus: dkimRaw === 'verified' || dkimRaw === 'failed' ? dkimRaw : 'pending',
    spfStatus: spfRaw === 'verified' || spfRaw === 'failed' ? spfRaw : 'pending',
    createdAt: formatSenderDate(raw.createdAt as string | undefined),
    lastUsedAt: formatSenderDate(raw.lastUsedAt as string | undefined),
  }
}

export const senderService = {
  async list(params?: { q?: string; status?: string }): Promise<VerifiedSender[]> {
    const search = new URLSearchParams()
    if (params?.q) search.set('q', params.q)
    if (params?.status && params.status !== 'all') search.set('status', params.status)
    const query = search.toString() ? `?${search.toString()}` : ''
    const rows = await apiClient<Record<string, unknown>[]>(`/senders${query}`, { method: 'GET' })
    return rows.map(mapSender)
  },

  async create(payload: { name: string; email: string }): Promise<VerifiedSender> {
    const data = await apiClient<Record<string, unknown>>('/senders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapSender(data)
  },

  async update(senderId: string, payload: { name?: string; status?: string }): Promise<VerifiedSender> {
    const data = await apiClient<Record<string, unknown>>(`/senders/${senderId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapSender(data)
  },

  async delete(senderId: string): Promise<void> {
    await apiClient<void>(`/senders/${senderId}`, { method: 'DELETE' })
  },

  async setDefault(senderId: string): Promise<VerifiedSender> {
    const data = await apiClient<Record<string, unknown>>(`/senders/${senderId}/default`, {
      method: 'POST',
    })
    return mapSender(data)
  },
}
