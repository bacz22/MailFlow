import React from 'react'
import { TrendingDown, TrendingUp, Info } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Tooltip } from './Tooltip'

export interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  changePeriod?: string
  icon?: React.ReactNode
  tooltip?: string
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  changePeriod = 'so với kỳ trước',
  icon,
  tooltip,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition duration-150 relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-ring rounded"
                aria-label="Thông tin chỉ số"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60">
            {icon}
          </div>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
        {value}
      </div>

      {change && (
        <div className="mt-2.5 flex items-center text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold mr-1.5',
              trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
              trend === 'down' && 'text-rose-600 dark:text-rose-400',
              trend === 'neutral' && 'text-slate-500 dark:text-slate-400'
            )}
          >
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {change}
          </span>
          <span className="text-slate-400 font-normal">{changePeriod}</span>
        </div>
      )}
    </div>
  )
}
