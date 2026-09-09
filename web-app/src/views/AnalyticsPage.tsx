import React, { startTransition, useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, MailOpen, MousePointerClick, Send, UserMinus } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { FeatureComingSoon } from '../components/ui/FeatureComingSoon'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Pagination } from '../components/ui/Pagination'
import { Button } from '../components/ui/Button'
import { SimpleSelect, type SelectOption } from '../components/ui/Select'
import { MetricWidget, ChartCard } from '../components/dashboard'
import { useToast } from '../components/ui/Toast'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  analyticsService,
  currentMonthKey,
  overviewToMetrics,
  rangeForMonth,
  rangeLastDays,
  type AnalyticsOverview,
  type AnalyticsRange,
} from '../services/analytics.service'
import type { CampaignAnalyticsRow, DailyPerformancePoint } from '../types/analytics.types'
import { ApiError } from '../services/apiClient'

export interface AnalyticsPageProps {
  onNavigate?: (path: string) => void
}

type PeriodMode = '30d' | 'month'

function formatSentAt(iso: string): string {
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

function buildMonthOptions(monthsBack = 24): SelectOption[] {
  const [cy, cm] = currentMonthKey().split('-').map(Number)
  const options: SelectOption[] = []
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(cy, cm - 1 - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const value = `${y}-${String(m).padStart(2, '0')}`
    const label = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  const { currentWorkspaceId } = useWorkspace()
  const [periodMode, setPeriodMode] = useState<PeriodMode>('30d')
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [series, setSeries] = useState<DailyPerformancePoint[]>([])
  const [campaigns, setCampaigns] = useState<CampaignAnalyticsRow[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exporting, setExporting] = useState(false)
  const { showToast } = useToast()

  const monthOptions = useMemo(() => buildMonthOptions(24), [])

  const activeRange: AnalyticsRange = useMemo(
    () => (periodMode === 'month' ? rangeForMonth(monthKey) : rangeLastDays(30)),
    [periodMode, monthKey]
  )

  const totalItems = campaigns.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedCampaigns = campaigns.slice(startIndex, startIndex + pageSize)
  const hasContent = overview != null

  useEffect(() => {
    if (!currentWorkspaceId) return
    let cancelled = false
    const isFirst = overview == null
    if (isFirst) setInitialLoading(true)
    else setRefreshing(true)
    setError(null)
    setCurrentPage(1)
    Promise.all([
      analyticsService.getOverview(activeRange),
      analyticsService.getTimeseries(activeRange),
      analyticsService.getCampaigns(activeRange),
    ])
      .then(([o, t, c]) => {
        if (cancelled) return
        setOverview(o)
        setSeries(t)
        setCampaigns(c)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.detail : 'Không tải được analytics.')
      })
      .finally(() => {
        if (cancelled) return
        setInitialLoading(false)
        setRefreshing(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeRange, currentWorkspaceId])

  const metrics = overview ? overviewToMetrics(overview) : []

  const handlePeriodMode = (mode: PeriodMode) => {
    startTransition(() => setPeriodMode(mode))
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      await analyticsService.downloadAnalyticsXlsx(activeRange)
      showToast({
        type: 'success',
        title: 'Đã tải Analytics Excel',
        description: `Kỳ: ${activeRange.label}`,
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
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Báo cáo"
        description={`Hiệu suất gửi / mở / click — ${activeRange.label} (GMT+7).`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {periodMode === 'month' && (
              <div className="w-[10.5rem] shrink-0">
                <SimpleSelect
                  size="sm"
                  value={monthKey}
                  options={monthOptions}
                  placeholder="Chọn tháng"
                  className="w-full"
                  onValueChange={(val) => startTransition(() => setMonthKey(val))}
                />
              </div>
            )}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => handlePeriodMode('30d')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  periodMode === '30d'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                30 ngày
              </button>
              <button
                type="button"
                onClick={() => handlePeriodMode('month')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  periodMode === 'month'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Theo tháng
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              isLoading={exporting}
              disabled={initialLoading || refreshing || !!error}
              onClick={() => void handleExportExcel()}
            >
              Xuất Excel
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="border-rose-200 bg-rose-50/40">
          <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
        </Card>
      )}

      {initialLoading && !hasContent ? (
        <p className="text-xs text-slate-500">Đang tải…</p>
      ) : hasContent ? (
        <div
          className={`space-y-6 transition-opacity duration-200 ${
            refreshing ? 'opacity-55 pointer-events-none' : 'opacity-100'
          }`}
          aria-busy={refreshing}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map((m) => (
              <MetricWidget
                key={m.key}
                label={m.label}
                value={m.value}
                change={m.change}
                trend={m.trend}
                trendLabel={m.benchmark}
                icon={
                  m.key === 'sent' ? (
                    <Send className="w-4 h-4" />
                  ) : m.key === 'openRate' ? (
                    <MailOpen className="w-4 h-4" />
                  ) : m.key === 'clickRate' ? (
                    <MousePointerClick className="w-4 h-4" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )
                }
              />
            ))}
          </div>

          <ChartCard
            data={series}
            title={`Hiệu suất theo ngày (${activeRange.label})`}
            description="Sent / unique opens / unique clicks theo ngày (mốc GMT+7)."
          />

          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm">
                Chiến dịch đã gửi ({activeRange.label})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {campaigns.length === 0 ? (
                <p className="p-4 text-xs text-slate-500">Chưa có chiến dịch gửi trong kỳ.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-semibold">Tên</th>
                      <th className="py-2.5 px-3 font-semibold">Gửi lúc</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Sent</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Delivery</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Open</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Click</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Unsub</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Bounce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCampaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 cursor-pointer"
                        onClick={() => onNavigate?.(`/campaigns/${c.id}/report`)}
                      >
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                          {c.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {formatSentAt(c.sentAt)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{c.recipientsSent}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{c.deliveryRate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                          {c.openRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-violet-600">
                          {c.clickRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{c.unsubscribeRate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {c.bounceRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>

            {totalItems > 0 && (
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                itemLabel="chiến dịch"
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
              />
            )}
          </Card>
        </div>
      ) : (
        !error && (
          <FeatureComingSoon
            title="Chưa có dữ liệu"
            description="Gửi chiến dịch và tạo open/click để thấy số liệu tại đây."
          />
        )
      )}
    </div>
  )
}

export default AnalyticsPage
