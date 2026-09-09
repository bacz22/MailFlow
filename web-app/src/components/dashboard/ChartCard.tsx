import React, { useState } from 'react'
import { BarChart3, TrendingUp, Calendar, Inbox } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import { cn } from '../../utils/cn'

export interface ChartDataPoint {
  date: string
  sent: number
  opened: number
  clicked: number
}

export interface ChartCardProps {
  title?: string
  description?: string
  data?: ChartDataPoint[]
  isLoading?: boolean
  className?: string
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title = 'Hiệu Suất Phân Phối Email (Delivery & Open Performance)',
  description = 'Số lượng email đã gửi thành công và tỷ lệ người nhận mở tương tác theo thời gian.',
  data,
  isLoading = false,
  className,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Default sample dataset
  const sampleData: Record<'7d' | '30d' | '90d', ChartDataPoint[]> = {
    '7d': [
      { date: '19/08', sent: 12400, opened: 8400, clicked: 3100 },
      { date: '20/08', sent: 15800, opened: 10900, clicked: 4200 },
      { date: '21/08', sent: 18200, opened: 12600, clicked: 5100 },
      { date: '22/08', sent: 14600, opened: 9800, clicked: 3800 },
      { date: '23/08', sent: 21500, opened: 15100, clicked: 6200 },
      { date: '24/08', sent: 24800, opened: 17600, clicked: 7100 },
      { date: '25/08', sent: 22100, opened: 15800, clicked: 6400 },
    ],
    '30d': [
      { date: 'Tuần 1', sent: 68000, opened: 46200, clicked: 18400 },
      { date: 'Tuần 2', sent: 74000, opened: 51800, clicked: 21200 },
      { date: 'Tuần 3', sent: 89000, opened: 61400, clicked: 25600 },
      { date: 'Tuần 4', sent: 96000, opened: 68200, clicked: 28900 },
    ],
    '90d': [
      { date: 'Tháng 6', sent: 280000, opened: 192000, clicked: 78000 },
      { date: 'Tháng 7', sent: 340000, opened: 238000, clicked: 98000 },
      { date: 'Tháng 8', sent: 410000, opened: 291000, clicked: 121000 },
    ],
  }

  const activeData = data || sampleData[timeRange]

  // Render Loading Skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 flex items-end gap-3 pt-8">
            {[40, 65, 80, 50, 95, 100, 75].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render Empty State
  if (!activeData || activeData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
            Chưa có dữ liệu thống kê
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy bắt đầu phát chiến dịch đầu tiên để biểu đồ tự động ghi nhận số liệu.
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxVal = Math.max(...activeData.map((d) => d.sent)) * 1.3 || 1
  const totalSent = activeData.reduce((acc, d) => acc + d.sent, 0)
  const totalOpened = activeData.reduce((acc, d) => acc + d.opened, 0)
  const avgOpenRate = totalSent > 0 ? `${((totalOpened / totalSent) * 100).toFixed(1)}%` : '0%'

  // Determine density based on number of points (e.g. 7d vs 30d/month)
  const isDense = activeData.length > 14
  const isVeryDense = activeData.length > 25
  const labelStep = isVeryDense ? 5 : isDense ? 3 : 1

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
        </div>

        {/* Time Range Switcher — only when using built-in sample data */}
        {!data && (
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold shrink-0">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => {
                setTimeRange(range)
                setHoveredIdx(null)
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeRange === range
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {range === '7d' ? '7 Ngày' : range === '30d' ? '30 Ngày' : '90 Ngày'}
            </button>
          ))}
        </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Interactive Chart Container */}
        <div className="w-full">
          <div
            className={cn(
              "h-64 sm:h-72 w-full flex items-end pt-12 pb-1 relative select-none",
              isDense ? "gap-1 sm:gap-1.5" : "gap-2 sm:gap-4"
            )}
          >
            {/* Y-axis background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 dark:opacity-20 pb-6">
              <div className="border-b border-slate-300 dark:border-slate-600 border-dashed w-full" />
              <div className="border-b border-slate-300 dark:border-slate-600 border-dashed w-full" />
              <div className="border-b border-slate-300 dark:border-slate-600 border-dashed w-full" />
            </div>

            {/* Bars */}
            {activeData.map((d, idx) => {
              const sentHeight = (d.sent / maxVal) * 100
              const openedHeight = (d.opened / maxVal) * 100
              const isHovered = hoveredIdx === idx
              const isStep = idx % labelStep === 0
              const isLast = idx === activeData.length - 1
              const isFirst = idx === 0
              const showLabel = !isDense || isFirst || isLast || isStep || isHovered

              return (
                <div
                  key={idx}
                  className="flex-1 min-w-0 h-full flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Floating Tooltip — securely positioned inside chart bounds */}
                  {isHovered && (
                    <div
                      className={cn(
                        "absolute z-30 top-1 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700 rounded-xl p-2.5 shadow-xl text-xs whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 space-y-1",
                        idx < 3 ? "left-0" : idx > activeData.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                      )}
                    >
                      <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-blue-400" />
                        <span>{d.date}</span>
                      </div>
                      <div className="space-y-0.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-blue-400">Đã gửi:</span>
                          <strong className="font-bold">{d.sent.toLocaleString()}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-emerald-400">Đã mở:</span>
                          <strong className="font-bold">{d.opened.toLocaleString()}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-amber-400">Nhấp (CTR):</span>
                          <strong className="font-bold">{d.clicked.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Column Bars: flex-1 min-h-0 takes all height above date label */}
                  <div
                    className={cn(
                      "w-full flex-1 min-h-0 flex items-end justify-center gap-0.5 sm:gap-1 pb-1",
                      isDense ? "max-w-[28px]" : "max-w-[44px]"
                    )}
                  >
                    {/* Sent Bar */}
                    <div
                      style={{ height: `${sentHeight}%` }}
                      className={cn(
                        "w-1/2 transition-all",
                        isDense ? "rounded-t-xs" : "rounded-t-md",
                        isHovered
                          ? 'bg-blue-600 dark:bg-blue-500 shadow-md shadow-blue-500/20 scale-y-105'
                          : 'bg-blue-500/80 hover:bg-blue-600 dark:bg-blue-600/80'
                      )}
                    />
                    {/* Opened Bar */}
                    <div
                      style={{ height: `${openedHeight}%` }}
                      className={cn(
                        "w-1/2 transition-all",
                        isDense ? "rounded-t-xs" : "rounded-t-md",
                        isHovered
                          ? 'bg-emerald-600 dark:bg-emerald-400 shadow-md shadow-emerald-500/20 scale-y-105'
                          : 'bg-emerald-500/80 hover:bg-emerald-600 dark:bg-emerald-500/80'
                      )}
                    />
                  </div>

                  {/* X-axis Date label: shows date on hover or on sampled steps */}
                  <div
                    className={cn(
                      "shrink-0 h-5 w-auto overflow-visible whitespace-nowrap flex items-center justify-center text-[10px] sm:text-[11px] text-center select-none pt-0.5 transition-all duration-150",
                      isHovered
                        ? "text-blue-600 dark:text-blue-400 font-bold z-10 bg-white/95 dark:bg-slate-900/95 px-1.5 rounded-md shadow-xs ring-1 ring-blue-500/20"
                        : "font-medium text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {showLabel ? d.date : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              <span>Email Đã Gửi (Sent)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>Lượt Mở Email (Opened)</span>
            </div>
          </div>

          <div className="text-slate-400 text-[11px] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tỷ lệ mở trung bình: <strong className="text-slate-700 dark:text-slate-200 font-bold font-mono">{avgOpenRate}</strong></span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChartCard
