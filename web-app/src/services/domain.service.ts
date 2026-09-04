import { apiClient } from './apiClient'
import type { DomainItem, DnsRecord, DomainVerificationStatus } from '../types/domain.types'

function formatDomainDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function mapRecord(raw: Record<string, unknown>): DnsRecord {
  const purposeRaw = String(raw.purpose ?? 'SPF').toUpperCase()
  const purpose: DnsRecord['purpose'] =
    purposeRaw === 'DKIM' ||
    purposeRaw === 'DMARC' ||
    purposeRaw === 'MX' ||
    purposeRaw === 'VERIFY'
      ? purposeRaw
      : 'SPF'
  const statusRaw = String(raw.status ?? 'PENDING').toUpperCase()
  const status: DomainVerificationStatus =
    statusRaw === 'VERIFIED' || statusRaw === 'FAILED' ? statusRaw : 'PENDING'
  const typeRaw = String(raw.type ?? 'TXT').toUpperCase()
  const type: DnsRecord['type'] = typeRaw === 'CNAME' || typeRaw === 'MX' ? typeRaw : 'TXT'
  return {
    id: String(raw.id ?? ''),
    type,
    name: String(raw.name ?? ''),
    host: String(raw.host ?? '@'),
    value: String(raw.value ?? ''),
    status,
    purpose,
    description: String(raw.description ?? ''),
  }
}

function mapDomain(raw: Record<string, unknown>): DomainItem {
  const statusRaw = String(raw.status ?? 'PENDING').toUpperCase()
  const status: DomainVerificationStatus =
    statusRaw === 'VERIFIED' || statusRaw === 'FAILED' ? statusRaw : 'PENDING'
  const records = Array.isArray(raw.records)
    ? (raw.records as Record<string, unknown>[]).map(mapRecord)
    : []
  return {
    id: String(raw.id ?? ''),
    domain: String(raw.domain ?? ''),
    status,
    createdAt: formatDomainDate(raw.createdAt as string | undefined),
    lastVerifiedAt: raw.verifiedAt
      ? formatDomainDate(raw.verifiedAt as string)
      : 'Chưa xác thực',
    sendersCount: Number(raw.sendersCount ?? 0),
    records,
  }
}

export const domainService = {
  async list(params?: { q?: string; status?: string }): Promise<DomainItem[]> {
    const search = new URLSearchParams()
    if (params?.q) search.set('q', params.q)
    if (params?.status && params.status !== 'all') search.set('status', params.status)
    const query = search.toString() ? `?${search.toString()}` : ''
    const rows = await apiClient<Record<string, unknown>[]>(`/domains${query}`, { method: 'GET' })
    return rows.map(mapDomain)
  },

  async create(domain: string): Promise<DomainItem> {
    const data = await apiClient<Record<string, unknown>>('/domains', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    })
    return mapDomain(data)
  },

  async get(domainId: string): Promise<DomainItem> {
    const data = await apiClient<Record<string, unknown>>(`/domains/${domainId}`, { method: 'GET' })
    return mapDomain(data)
  },

  async verify(domainId: string): Promise<DomainItem> {
    const data = await apiClient<Record<string, unknown>>(`/domains/${domainId}/verify`, {
      method: 'POST',
    })
    return mapDomain(data)
  },

  async delete(domainId: string): Promise<void> {
    await apiClient<void>(`/domains/${domainId}`, { method: 'DELETE' })
  },
}
