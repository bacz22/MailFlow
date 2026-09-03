import React from 'react'
import { Search, Filter, X, RotateCcw } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { SimpleSelect } from '../ui/Select'
import type { ContactFilterState } from '../../types/contact.types'

export interface ContactFiltersProps {
  filters: ContactFilterState
  onFilterChange: (newFilters: Partial<ContactFilterState>) => void
  onClearFilters: () => void
  totalCount?: number
  filteredCount?: number
  availableLists?: { id: string; name: string }[]
  availableTags?: string[]
  availableSegments?: { id: string; name: string }[]
  className?: string
}

export const ContactFilters: React.FC<ContactFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalCount,
  filteredCount,
  availableLists = [],
  availableTags = ['Customer', 'Lead', 'High Value', 'Engaged', 'Churn Risk'],
  availableSegments = [],
  className,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.selectedList !== 'all' ||
    filters.selectedTag !== 'all' ||
    filters.selectedStatus !== 'all' ||
    filters.selectedSegment !== 'all'

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
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[140px]">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline whitespace-nowrap">Trạng thái:</span>
            <div className="w-40">
              <SimpleSelect
                size="sm"
                value={filters.selectedStatus}
                onValueChange={(val) => onFilterChange({ selectedStatus: val })}
                options={[
                  { value: 'all', label: 'Tất cả trạng thái' },
                  { value: 'active', label: 'Hoạt động (Active)' },
                  { value: 'unsubscribed', label: 'Hủy đăng ký' },
                  { value: 'bounced', label: 'Bounced (Trả về)' },
                  { value: 'invalid', label: 'Không hợp lệ' },
                  { value: 'blocked', label: 'Đã chặn (Spam)' },
                ]}
                placeholder="Chọn trạng thái..."
              />
            </div>
          </div>

          {/* List Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[140px]">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline whitespace-nowrap">Danh sách:</span>
            <div className="w-44">
              <SimpleSelect
                size="sm"
                value={filters.selectedList}
                onValueChange={(val) => onFilterChange({ selectedList: val, selectedSegment: 'all' })}
                options={[
                  { value: 'all', label: 'Tất cả danh sách' },
                  ...availableLists.map((l) => ({ value: l.id, label: l.name })),
                ]}
                placeholder="Chọn danh sách..."
              />
            </div>
          </div>

          {/* Segment Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[140px]">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline whitespace-nowrap">Phân đoạn:</span>
            <div className="w-44">
              <SimpleSelect
                size="sm"
                value={filters.selectedSegment || 'all'}
                onValueChange={(val) => onFilterChange({ selectedSegment: val, selectedList: 'all' })}
                options={[
                  { value: 'all', label: 'Tất cả phân đoạn' },
                  ...availableSegments.map((s) => ({ value: s.id, label: s.name })),
                ]}
                placeholder="Chọn phân đoạn..."
              />
            </div>
          </div>

          {/* Tag Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[130px]">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline whitespace-nowrap">Thẻ (Tag):</span>
            <div className="w-36">
              <SimpleSelect
                size="sm"
                value={filters.selectedTag}
                onValueChange={(val) => onFilterChange({ selectedTag: val })}
                options={[
                  { value: 'all', label: 'Tất cả thẻ tag' },
                  ...availableTags.map((t) => ({ value: t, label: t })),
                ]}
                placeholder="Chọn thẻ..."
              />
            </div>
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
