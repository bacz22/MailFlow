import { apiClient, apiDownloadBlob } from './apiClient'
import type {
  AnalyticsMetric,
  CampaignAnalyticsRow,
  DailyPerformancePoint,
} from '../types/analytics.types'

export interface AnalyticsOverview {
  sent: number
  uniqueOpens: number
  uniqueClicks: number
  unsubscribes: number
  failed: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
  sentChangePct: number | null
  openChangePct: number | null
  clickChangePct: number | null
}

export interface CampaignReport {
  campaignId: string
  name: string
  status: string
  sentCount: number
  failedCount: number
  uniqueOpens: number
  uniqueClicks: number
  unsubscribedRecipients: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
  bounceRate: number
  startedAt?: string
  completedAt?: string
  topLinks: Array<{ url: string; clicks: number }>
}

export interface EngagementEventItem {
  id: string
  campaignId: string
  contactId: string
  contactEmail: string
  eventType: string
  targetUrl?: string
  createdAt: string
}

export interface EngagementPage {
  content: EngagementEventItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) search.set(k, v)
  })
  const s = search.toString()
  return s ? `?${s}` : ''
}

export type AnalyticsRange = { from: string; to: string; label: string }

/** Rolling last N days ending now. */
export function rangeLastDays(days = 30): AnalyticsRange {
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    label: `${days} ngày gần nhất`,
  }
}

/**
 * Calendar month in Asia/Ho_Chi_Minh (GMT+7), matching quota day boundary.
 * @param monthKey YYYY-MM
 */
export function rangeForMonth(monthKey: string): AnalyticsRange {
  const [y, m] = monthKey.split('-').map(Number)
  if (!y || !m) {
    return rangeLastDays(30)
  }
  // GMT+7 midnight = UTC previous day 17:00
  const from = new Date(Date.UTC(y, m - 1, 1, -7, 0, 0, 0))
  const to = new Date(Date.UTC(y, m, 1, -7, 0, 0, 0))
  const label = new Date(y, m - 1, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  })
  return { from: from.toISOString(), to: to.toISOString(), label }
}

export function currentMonthKey(): string {
  const now = new Date()
  // Approximate VN local month via offset +7
  const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const y = vn.getUTCFullYear()
  const m = String(vn.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatChange(pct: number | null | undefined): { change: string; trend: 'up' | 'down' | 'neutral' } {
  if (pct == null) {
    return { change: '—', trend: 'neutral' }
  }
  const sign = pct > 0 ? '+' : ''
  return {
    change: `${sign}${pct}%`,
    trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
  }
}

export function overviewToMetrics(o: AnalyticsOverview): AnalyticsMetric[] {
  const sentCh = formatChange(o.sentChangePct)
  const openCh = formatChange(o.openChangePct)
  const clickCh = formatChange(o.clickChangePct)
  return [
    {
      key: 'sent',
      label: 'Email đã gửi',
      value: o.sent.toLocaleString('vi-VN'),
      numericValue: o.sent,
      change: sentCh.change,
      trend: sentCh.trend,
      benchmark: 'Kỳ trước',
      tooltip: 'Số email SENT trong khoảng thời gian',
    },
    {
      key: 'openRate',
      label: 'Tỷ lệ mở',
      value: `${o.openRate}%`,
      numericValue: o.openRate,
      change: openCh.change,
      trend: openCh.trend,
      benchmark: 'Kỳ trước',
      tooltip: 'Unique opens / sent',
    },
    {
      key: 'clickRate',
      label: 'Tỷ lệ click',
      value: `${o.clickRate}%`,
      numericValue: o.clickRate,
      change: clickCh.change,
      trend: clickCh.trend,
      benchmark: 'Kỳ trước',
      tooltip: 'Unique clicks / sent',
    },
    {
      key: 'unsubRate',
      label: 'Tỷ lệ hủy đăng ký',
      value: `${o.unsubscribeRate}%`,
      numericValue: o.unsubscribeRate,
      change: '—',
      trend: 'neutral',
      benchmark: 'Ước lượng',
      tooltip: 'Contact UNSUBSCRIBED trong recipients đã gửi',
    },
  ]
}

function mapOverview(raw: Record<string, unknown>): AnalyticsOverview {
  return {
    sent: Number(raw.sent ?? 0),
    uniqueOpens: Number(raw.uniqueOpens ?? 0),
    uniqueClicks: Number(raw.uniqueClicks ?? 0),
    unsubscribes: Number(raw.unsubscribes ?? 0),
    failed: Number(raw.failed ?? 0),
    openRate: Number(raw.openRate ?? 0),
    clickRate: Number(raw.clickRate ?? 0),
    unsubscribeRate: Number(raw.unsubscribeRate ?? 0),
    sentChangePct: raw.sentChangePct == null ? null : Number(raw.sentChangePct),
    openChangePct: raw.openChangePct == null ? null : Number(raw.openChangePct),
    clickChangePct: raw.clickChangePct == null ? null : Number(raw.clickChangePct),
  }
}

function mapCampaignRow(raw: Record<string, unknown>): CampaignAnalyticsRow {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    sentAt: raw.sentAt ? String(raw.sentAt) : '',
    recipientsSent: Number(raw.recipientsSent ?? 0),
    deliveryRate: Number(raw.deliveryRate ?? 0),
    openRate: Number(raw.openRate ?? 0),
    clickRate: Number(raw.clickRate ?? 0),
    bounceRate: Number(raw.bounceRate ?? 0),
    unsubscribeRate: Number(raw.unsubscribeRate ?? 0),
  }
}

function mapEngagement(raw: Record<string, unknown>): EngagementEventItem {
  return {
    id: String(raw.id),
    campaignId: String(raw.campaignId),
    contactId: String(raw.contactId),
    contactEmail: String(raw.contactEmail ?? '—'),
    eventType: String(raw.eventType ?? ''),
    targetUrl: raw.targetUrl ? String(raw.targetUrl) : undefined,
    createdAt: String(raw.createdAt ?? ''),
  }
}

export const analyticsService = {
  async getOverview(range: AnalyticsRange = rangeLastDays(30)): Promise<AnalyticsOverview> {
    const data = await apiClient<Record<string, unknown>>(
      `/analytics/overview${qs({ from: range.from, to: range.to })}`,
      { method: 'GET' }
    )
    return mapOverview(data)
  },

  async getTimeseries(range: AnalyticsRange = rangeLastDays(30)): Promise<DailyPerformancePoint[]> {
    const data = await apiClient<{ points?: Record<string, unknown>[] }>(
      `/analytics/timeseries${qs({ from: range.from, to: range.to })}`,
      { method: 'GET' }
    )
    return (data.points ?? []).map((p) => ({
      date: String(p.date ?? ''),
      sent: Number(p.sent ?? 0),
      opened: Number(p.opened ?? 0),
      clicked: Number(p.clicked ?? 0),
    }))
  },

  async getCampaigns(range: AnalyticsRange = rangeLastDays(30)): Promise<CampaignAnalyticsRow[]> {
    const data = await apiClient<Record<string, unknown>[]>(
      `/analytics/campaigns${qs({ from: range.from, to: range.to })}`,
      { method: 'GET' }
    )
    return (Array.isArray(data) ? data : []).map(mapCampaignRow)
  },

  async getCampaignReport(campaignId: string): Promise<CampaignReport> {
    const raw = await apiClient<Record<string, unknown>>(
      `/campaigns/${campaignId}/report`,
      { method: 'GET' }
    )
    const links = Array.isArray(raw.topLinks) ? raw.topLinks : []
    return {
      campaignId: String(raw.campaignId),
      name: String(raw.name ?? ''),
      status: String(raw.status ?? ''),
      sentCount: Number(raw.sentCount ?? 0),
      failedCount: Number(raw.failedCount ?? 0),
      uniqueOpens: Number(raw.uniqueOpens ?? 0),
      uniqueClicks: Number(raw.uniqueClicks ?? 0),
      unsubscribedRecipients: Number(raw.unsubscribedRecipients ?? 0),
      openRate: Number(raw.openRate ?? 0),
      clickRate: Number(raw.clickRate ?? 0),
      unsubscribeRate: Number(raw.unsubscribeRate ?? 0),
      bounceRate: Number(raw.bounceRate ?? 0),
      startedAt: raw.startedAt ? String(raw.startedAt) : undefined,
      completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
      topLinks: links.map((l) => {
        const row = l as Record<string, unknown>
        return { url: String(row.url ?? ''), clicks: Number(row.clicks ?? 0) }
      }),
    }
  },

  async getCampaignEngagements(
    campaignId: string,
    opts?: { type?: string; page?: number; size?: number }
  ): Promise<EngagementPage> {
    const data = await apiClient<Record<string, unknown>>(
      `/campaigns/${campaignId}/engagements${qs({
        type: opts?.type,
        page: opts?.page != null ? String(opts.page) : '0',
        size: opts?.size != null ? String(opts.size) : '20',
      })}`,
      { method: 'GET' }
    )
    const content = Array.isArray(data.content) ? data.content : []
    return {
      content: content.map((e) => mapEngagement(e as Record<string, unknown>)),
      page: Number(data.page ?? 0),
      size: Number(data.size ?? 20),
      totalElements: Number(data.totalElements ?? 0),
      totalPages: Number(data.totalPages ?? 0),
    }
  },

  async getContactEngagements(
    contactId: string,
    opts?: { page?: number; size?: number }
  ): Promise<EngagementPage> {
    const data = await apiClient<Record<string, unknown>>(
      `/contacts/${contactId}/engagements${qs({
        page: opts?.page != null ? String(opts.page) : '0',
        size: opts?.size != null ? String(opts.size) : '20',
      })}`,
      { method: 'GET' }
    )
    const content = Array.isArray(data.content) ? data.content : []
    return {
      content: content.map((e) => mapEngagement(e as Record<string, unknown>)),
      page: Number(data.page ?? 0),
      size: Number(data.size ?? 20),
      totalElements: Number(data.totalElements ?? 0),
      totalPages: Number(data.totalPages ?? 0),
    }
  },

  async downloadCampaignReportXlsx(campaignId: string): Promise<void> {
    await apiDownloadBlob(
      `/campaigns/${campaignId}/report/export`,
      `campaign-report-${campaignId}.xlsx`
    )
  },

  async downloadAnalyticsXlsx(range: AnalyticsRange = rangeLastDays(30)): Promise<void> {
    const stamp = range.label.replace(/\s+/g, '-').toLowerCase()
    await apiDownloadBlob(
      `/analytics/export${qs({ from: range.from, to: range.to })}`,
      `analytics-${stamp}.xlsx`
    )
  },
}
