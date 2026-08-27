import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'

export interface MetricWidgetProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  icon?: React.ReactNode
  iconBgColor?: string
  sparklineData?: number[]
  className?: string
  onClick?: () => void
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  trendLabel = 'so với tháng trước',
  icon,
  iconBgColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  sparklineData,
  className,
  onClick,
}) => {
  // Generate simple inline SVG sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null
    const min = Math.min(...sparklineData)
    const max = Math.max(...sparklineData)
    const range = max - min || 1
    const width = 64
    const height = 24

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width
        const y = height - ((val - min) / range) * (height - 4) - 2
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

    const strokeColor =
      trend === 'up' ? '#16A34A' : trend === 'down' ? '#DC2626' : '#2563EB'

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    )
  }

  return (
    <Card
      className={cn(
        'p-4 sm:p-5 transition-all hover:shadow-md border-slate-200/80 dark:border-slate-800 relative overflow-hidden',
        onClick && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-800',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            {label}
          </p>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-mono">
            {value}
          </div>
        </div>

        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-800/50 shadow-xs',
              iconBgColor
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        {change ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold font-mono text-[11px]',
                trend === 'up' &&
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                trend === 'down' &&
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
                trend === 'neutral' &&
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
              {change}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {trendLabel}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Dữ liệu cập nhật realtime
          </span>
        )}

        {renderSparkline()}
      </div>
    </Card>
  )
}

export default MetricWidget
