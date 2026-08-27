import React from 'react'
import { Search, Filter, X, RotateCcw } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { ContactFilterState } from '../../types/contact.types'

export interface ContactFiltersProps {
  filters: ContactFilterState
  onFilterChange: (newFilters: Partial<ContactFilterState>) => void
  onClearFilters: () => void
  totalCount?: number
  filteredCount?: number
  availableLists?: string[]
  availableTags?: string[]
  className?: string
}

export const ContactFilters: React.FC<ContactFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalCount,
  filteredCount,
  availableLists = ['VIP Enterprise', 'Webinar Leads', 'Newsletter Subscribers', 'Trial Users'],
  availableTags = ['Customer', 'Lead', 'High Value', 'Engaged', 'Churn Risk'],
  className,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.selectedList !== 'all' ||
    filters.selectedTag !== 'all' ||
    filters.selectedStatus !== 'all'

  return (
    <div className={`space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs ${className || ''}`}>
      {/* Top Search & Primary Filters Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm theo tên, email, công ty..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            rightIcon={
              filters.searchQuery ? (
                <button
                  type="button"
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Filter Dropdowns Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Trạng thái:</span>
            <select
              value={filters.selectedStatus}
              onChange={(e) => onFilterChange({ selectedStatus: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus-ring cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động (Active)</option>
              <option value="unsubscribed">Hủy đăng ký</option>
              <option value="bounced">Bounced (Trả về)</option>
              <option value="invalid">Không hợp lệ</option>
              <option value="blocked">Đã chặn (Spam)</option>
            </select>
          </div>

          {/* List Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Danh sách:</span>
            <select
              value={filters.selectedList}
              onChange={(e) => onFilterChange({ selectedList: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus-ring cursor-pointer"
            >
              <option value="all">Tất cả danh sách</option>
              {availableLists.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Thẻ (Tag):</span>
            <select
              value={filters.selectedTag}
              onChange={(e) => onFilterChange({ selectedTag: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus-ring cursor-pointer"
            >
              <option value="all">Tất cả thẻ tag</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Xóa Bộ Lọc
            </Button>
          )}
        </div>
      </div>

      {/* Filter Summary Stats */}
      {isFiltered && totalCount !== undefined && filteredCount !== undefined && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <strong className="text-slate-900 dark:text-slate-100 font-mono">{filteredCount}</strong> / {totalCount} liên hệ phù hợp
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">Đang lọc dữ liệu</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactFilters
