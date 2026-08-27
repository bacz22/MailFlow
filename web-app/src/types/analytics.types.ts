export interface AnalyticsMetric {
  key: string
  label: string
  value: string
  numericValue: number
  change: string
  trend: 'up' | 'down' | 'neutral'
  benchmark: string
  tooltip: string
}

export interface CampaignAnalyticsRow {
  id: string
  name: string
  sentAt: string
  recipientsSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubscribeRate: number
}

export interface DailyPerformancePoint {
  date: string
  sent: number
  opened: number
  clicked: number
}
