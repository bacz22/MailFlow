import React from 'react'
import { SearchX, Inbox, AlertTriangle, RefreshCw, Plus } from 'lucide-react'
import { Button } from './Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionIcon?: React.ReactNode
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionIcon = <Plus className="w-3.5 h-3.5" />,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 space-y-4 max-w-lg mx-auto my-6 shadow-xs animate-in fade-in-0 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
        {icon || <Inbox className="w-7 h-7" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={actionIcon}
            onClick={onAction}
            className="text-xs"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export interface FilteredEmptyStateProps {
  searchQuery?: string
  onClearFilters: () => void
  className?: string
}

export const FilteredEmptyState: React.FC<FilteredEmptyStateProps> = ({
  searchQuery,
  onClearFilters,
  className = '',
}) => {
  return (
    <div
      className={`p-10 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs animate-in fade-in-0 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
        <SearchX className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Không Tìm Thấy Kết Quả Phù Hợp
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {searchQuery
            ? `Không có bản ghi nào khớp với từ khóa "${searchQuery}" và các tiêu chí lọc đang chọn.`
            : 'Không có dữ liệu nào khớp với các điều kiện lọc hiện tại.'}
        </p>
      </div>

      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="text-xs"
        >
          Xóa Bộ Lọc Tìm Kiếm
        </Button>
      </div>
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã Xảy Ra Lỗi Khi Tải Dữ Liệu',
  message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng và thử lại.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-10 text-center bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-3 text-rose-900 dark:text-rose-200 animate-in fade-in-0 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">{title}</h4>
        <p className="text-xs text-rose-800/80 dark:text-rose-300 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onRetry}
            className="text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            Thử Lại
          </Button>
        </div>
      )}
    </div>
  )
}

export default EmptyState
