import React, { useEffect, useState } from 'react'
import { MailOpen, MousePointerClick, Send, UserMinus } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { AcceptInviteForm } from '../components/workspace/AcceptInviteForm'
import { UsageCard, MetricWidget, ChartCard } from '../components/dashboard'
import { usePermission, ROLES } from '../permissions'
import { useWorkspace } from '../context/WorkspaceContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  analyticsService,
  overviewToMetrics,
  rangeLastDays,
  type AnalyticsOverview,
} from '../services/analytics.service'
import type { DailyPerformancePoint } from '../types/analytics.types'

export interface DashboardPageProps {
  onNavigate?: (path: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentRole, roleMetadata, canAccessRoute } = usePermission()
  const { currentWorkspaceId } = useWorkspace()
  const showUsage =
    currentRole === ROLES.OWNER ||
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.BILLING_MANAGER
  const canAnalytics = canAccessRoute('/analytics') || canAccessRoute('/campaigns')

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [series, setSeries] = useState<DailyPerformancePoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!canAnalytics || !currentWorkspaceId) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      analyticsService.getOverview(rangeLastDays(7)),
      analyticsService.getTimeseries(rangeLastDays(7)),
    ])
      .then(([o, t]) => {
        if (cancelled) return
        setOverview(o)
        setSeries(t)
      })
      .catch(() => {
        if (!cancelled) {
          setOverview(null)
          setSeries([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [canAnalytics, currentWorkspaceId])

  const metrics = overview ? overviewToMetrics(overview) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Tổng Quan"
        description="Hạn mức gửi demo và hiệu suất 7 ngày gần nhất."
        badge={
          <Badge variant={roleMetadata.badgeVariant} className="text-xs">
            {roleMetadata.name} ({roleMetadata.titleVn})
          </Badge>
        }
      />

      <Card className="border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
        <CardContent className="p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Được mời tham gia workspace?
          </div>
          <p className="text-[11px] text-slate-500">
            Dán mã token trong email thư mời (không cần bấm nút “Chấp nhận lời mời”) sau khi đã đăng
            nhập đúng email được mời.
          </p>
          <AcceptInviteForm />
        </CardContent>
      </Card>

      {showUsage && (
        <div className="max-w-md">
          <UsageCard onUpgrade={() => onNavigate?.('/settings/billing')} />
        </div>
      )}

      {canAnalytics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Hiệu suất 7 ngày
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.('/analytics')}
            >
              Xem Analytics
            </Button>
          </div>

          {loading && <p className="text-xs text-slate-500">Đang tải số liệu…</p>}

          {!loading && metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {metrics.map((m) => (
                <MetricWidget
                  key={m.key}
                  label={m.label}
                  value={m.value}
                  change={m.change}
                  trend={m.trend}
                  trendLabel="so với 7 ngày trước"
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
                  onClick={() => onNavigate?.('/analytics')}
                />
              ))}
            </div>
          )}

          {!loading && (
            <ChartCard
              data={series}
              title="Gửi & mở (7 ngày)"
              description="Dữ liệu thật từ campaign send + engagement events."
            />
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardPage
