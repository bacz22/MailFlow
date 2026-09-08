import React, { useEffect, useState } from 'react'
import { ArrowLeft, MousePointerClick, MailOpen, Send, UserMinus, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { MetricWidget } from '../components/dashboard'
import { useToast } from '../components/ui/Toast'
import {
  analyticsService,
  type CampaignReport,
  type EngagementEventItem,
} from '../services/analytics.service'
import { ApiError } from '../services/apiClient'

export interface CampaignReportPageProps {
  campaignId: string
  onNavigate: (path: string) => void
}

function formatWhen(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export const CampaignReportPage: React.FC<CampaignReportPageProps> = ({
  campaignId,
  onNavigate,
}) => {
  const [report, setReport] = useState<CampaignReport | null>(null)
  const [events, setEvents] = useState<EngagementEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      analyticsService.getCampaignReport(campaignId),
      analyticsService.getCampaignEngagements(campaignId, { page: 0, size: 30 }),
    ])
      .then(([r, page]) => {
        if (cancelled) return
        setReport(r)
        setEvents(page.content)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.detail : 'Không tải được báo cáo.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      await analyticsService.downloadCampaignReportXlsx(campaignId)
      showToast({
        type: 'success',
        title: 'Đã tải báo cáo Excel',
        description: 'File .xlsx đã được lưu về máy.',
      })
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không xuất được Excel',
        description: err instanceof ApiError ? err.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate(`/campaigns/${campaignId}`)}
        >
          Quay Lại Chiến Dịch
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          isLoading={exporting}
          disabled={loading || !!error}
          onClick={() => void handleExportExcel()}
        >
          Xuất Excel
        </Button>
      </div>

      <PageHeader
        title={report?.name ? `Báo cáo: ${report.name}` : 'Báo Cáo Chiến Dịch'}
        description="Delivery, open, click và nhật ký tương tác từ tracking MailFlow."
        badge={
          report ? (
            <Badge variant="success" className="text-xs">
              {report.status}
            </Badge>
          ) : undefined
        }
      />

      {loading && (
        <p className="text-xs text-slate-500">Đang tải báo cáo…</p>
      )}
      {error && (
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">{error}</CardContent>
        </Card>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricWidget
              label="Đã gửi"
              value={report.sentCount.toLocaleString('vi-VN')}
              icon={<Send className="w-4 h-4" />}
            />
            <MetricWidget
              label="Tỷ lệ mở"
              value={`${report.openRate}%`}
              change={`${report.uniqueOpens} unique`}
              trend="neutral"
              trendLabel="mở thư"
              icon={<MailOpen className="w-4 h-4" />}
              iconBgColor="bg-emerald-500/10 text-emerald-600"
            />
            <MetricWidget
              label="Tỷ lệ click"
              value={`${report.clickRate}%`}
              change={`${report.uniqueClicks} unique`}
              trend="neutral"
              trendLabel="nhấp link"
              icon={<MousePointerClick className="w-4 h-4" />}
              iconBgColor="bg-violet-500/10 text-violet-600"
            />
            <MetricWidget
              label="Hủy đăng ký"
              value={`${report.unsubscribeRate}%`}
              change={`${report.unsubscribedRecipients} contact`}
              trend="neutral"
              trendLabel="trong recipients"
              icon={<UserMinus className="w-4 h-4" />}
              iconBgColor="bg-amber-500/10 text-amber-600"
            />
            <MetricWidget
              label="Bounce"
              value={`${report.bounceRate}%`}
              change="Brevo webhook"
              trend="neutral"
              trendLabel="hard + soft"
              icon={<AlertTriangle className="w-4 h-4" />}
              iconBgColor="bg-rose-500/10 text-rose-600"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Bắt đầu: {formatWhen(report.startedAt)} · Hoàn tất: {formatWhen(report.completedAt)}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm">Top link được click</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {report.topLinks.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500">Chưa có click nào.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.topLinks.map((link) => (
                      <li
                        key={link.url}
                        className="px-4 py-3 flex items-start justify-between gap-3 text-xs"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 break-all hover:underline"
                        >
                          {link.url}
                        </a>
                        <span className="font-mono font-bold shrink-0">{link.clicks}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm">Nhật ký tương tác gần đây</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {events.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500">Chưa có sự kiện open/click.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-auto">
                    {events.map((ev) => (
                      <li key={ev.id} className="px-4 py-2.5 text-xs space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {ev.eventType}
                          </span>
                          <span className="text-slate-400 font-mono">{formatWhen(ev.createdAt)}</span>
                        </div>
                        <div className="text-slate-500">{ev.contactEmail}</div>
                        {ev.targetUrl && (
                          <div className="text-slate-400 truncate" title={ev.targetUrl}>
                            {ev.targetUrl}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default CampaignReportPage
