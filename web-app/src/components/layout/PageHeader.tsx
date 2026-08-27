import React from 'react'
import { cn } from '../../utils/cn'
import { Breadcrumb } from '../ui/Breadcrumb'
import type { BreadcrumbItem } from '../ui/Breadcrumb'

export interface PageHeaderProps {
  title: string
  description?: string
  badge?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  tabs?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
  tabs,
  className,
}) => {
  return (
    <div className={cn('space-y-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80', className)}>
      {/* Optional Breadcrumbs above Title */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="pb-1">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      {/* Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Optional Sub-Navigation Tabs */}
      {tabs && <div className="pt-2">{tabs}</div>}
    </div>
  )
}

export default PageHeader
