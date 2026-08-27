import React from 'react'
import { cn } from '../../utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200/80 dark:bg-slate-800/80',
        variant === 'rectangular' && 'rounded-xl',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded-md',
        className
      )}
      {...props}
    />
  )
}

/** Table Skeleton for Contacts, Campaigns, Members, Senders, Invoices */
export interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={cn('w-full space-y-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Table rows skeleton */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-2">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cn(
                  'h-4',
                  cIdx === 0 ? 'w-1/4' : cIdx === 1 ? 'w-1/3' : 'flex-1'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Metric Card Skeleton for Dashboards & Analytics */
export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Chart Skeleton for Analytics & Performance */
export const ChartSkeleton: React.FC<{ heightClass?: string }> = ({
  heightClass = 'h-64',
}) => {
  return (
    <div className={cn('p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4', heightClass)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex-1 h-3/4 flex items-end gap-2 pt-4">
        {Array.from({ length: 12 }).map((_, idx) => (
          <Skeleton
            key={idx}
            className="flex-1 rounded-t-lg"
            style={{ height: `${30 + (idx % 5) * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

/** Card Grid Skeleton for Templates & Lists */
export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
