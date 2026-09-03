import React, { useState } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  SearchX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Mail,
} from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'
import { Skeleton } from '../ui/Skeleton'
import { Button } from '../ui/Button'
import { ContactStatusBadge } from './ContactStatusBadge'
import { ContactRowActions } from './ContactRowActions'
import type { Contact } from '../../types/contact.types'

export type SortField = 'fullName' | 'email' | 'company' | 'status' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

export interface ServerPaginationConfig {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export interface ContactTableProps {
  contacts: Contact[]
  selectedIds: string[]
  onSelectRow: (id: string, selected: boolean) => void
  onSelectAllPage: (selected: boolean) => void
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  isSearchFiltered?: boolean
  onClearFilters?: () => void
  onViewContact?: (contact: Contact) => void
  onEditContact?: (contact: Contact) => void
  onAddToList?: (contact: Contact) => void
  onDeleteContact?: (contact: Contact) => void
  serverPagination?: ServerPaginationConfig
  sortField?: SortField
  sortOrder?: SortOrder
  onSortChange?: (field: SortField, order: SortOrder) => void
  className?: string
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  selectedIds,
  onSelectRow,
  onSelectAllPage,
  isLoading = false,
  isError = false,
  errorMessage = 'Đã có lỗi xảy ra khi kết nối máy chủ.',
  isSearchFiltered = false,
  onClearFilters,
  onViewContact,
  onEditContact,
  onAddToList,
  onDeleteContact,
  serverPagination,
  sortField: externalSortField,
  sortOrder: externalSortOrder,
  onSortChange,
  className,
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const activeSortField = externalSortField ?? sortField
  const activeSortOrder = externalSortOrder ?? sortOrder

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const handleSort = (field: SortField) => {
    const nextOrder =
      activeSortField === field ? (activeSortOrder === 'asc' ? 'desc' : 'asc') : 'asc'
    if (onSortChange) {
      onSortChange(field, nextOrder)
      return
    }
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Sort logic
  const sortedContacts = serverPagination
    ? contacts
    : [...contacts].sort((a, b) => {
        let aVal = a[activeSortField] || ''
        let bVal = b[activeSortField] || ''

        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()

        if (aVal < bVal) return activeSortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return activeSortOrder === 'asc' ? 1 : -1
        return 0
      })

  // Pagination calculation
  const totalItems = serverPagination?.totalElements ?? sortedContacts.length
  const totalPages = serverPagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize))
  const activePage = serverPagination?.page ?? currentPage
  const activePageSize = serverPagination?.pageSize ?? pageSize
  const startIndex = serverPagination ? activePage * activePageSize : (currentPage - 1) * pageSize
  const paginatedContacts = serverPagination
    ? sortedContacts
    : sortedContacts.slice(startIndex, startIndex + pageSize)

  const isAllPageSelected =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((c) => selectedIds.includes(c.id))

  const isSomePageSelected =
    paginatedContacts.some((c) => selectedIds.includes(c.id)) && !isAllPageSelected

  // Render Sort Header Indicator
  const renderSortIcon = (field: SortField) => {
    if (activeSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline-block" />
    }
    return activeSortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    )
  }

  // 1. STATE: LOADING SKELETON
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 overflow-hidden p-4 space-y-4">
        <div className="flex items-center justify-between pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 2. STATE: SERVER ERROR
  if (isError) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Không Thể Tải Danh Bạ
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{errorMessage}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Thử Lại
        </Button>
      </div>
    )
  }

  // 3. STATE: EMPTY DATABASE
  if (contacts.length === 0 && !isSearchFiltered) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-sm">
          <Inbox className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Chưa Có Liên Hệ Nào
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Danh bạ của bạn hiện đang trống. Hãy thêm liên hệ đầu tiên hoặc import từ file CSV để bắt đầu chiến dịch marketing.
          </p>
        </div>
      </div>
    )
  }

  // 4. STATE: NO SEARCH/FILTER RESULT
  if (contacts.length === 0 && isSearchFiltered) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Không Tìm Thấy Liên Hệ Phù Hợp
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Không có liên hệ nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
          </p>
        </div>
        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Xóa Toàn Bộ Bộ Lọc
          </Button>
        )}
      </div>
    )
  }

  // 5. MAIN DATA-DENSE TABLE (Desktop) & ADAPTIVE CARDS (Mobile)
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden flex flex-col ${className || ''}`}>
      {/* Desktop & Tablet Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold select-none sticky top-0 z-10">
            <tr>
              {/* Checkbox Column */}
              <th className="py-3 px-4 w-10">
                <Checkbox
                  id="select-all-page"
                  checked={isAllPageSelected ? true : isSomePageSelected ? ('indeterminate' as any) : false}
                  onCheckedChange={(checked) => onSelectAllPage(!!checked)}
                  aria-label="Chọn tất cả trên trang"
                />
              </th>

              {/* Name Column */}
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition whitespace-nowrap min-w-[180px]"
                onClick={() => handleSort('fullName')}
              >
                <span>Họ và Tên</span>
                {renderSortIcon('fullName')}
              </th>

              {/* Email Column */}
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition whitespace-nowrap min-w-[200px]"
                onClick={() => handleSort('email')}
              >
                <span>Địa Chỉ Email</span>
                {renderSortIcon('email')}
              </th>

              {/* Company Column */}
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition whitespace-nowrap"
                onClick={() => handleSort('company')}
              >
                <span>Công Ty</span>
                {renderSortIcon('company')}
              </th>

              {/* Lists Column */}
              <th className="py-3 px-3 whitespace-nowrap min-w-[140px]">
                <span>Danh Sách (Lists)</span>
              </th>

              {/* Tags Column */}
              <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">
                <span>Thẻ (Tags)</span>
              </th>

              {/* Status Column */}
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition whitespace-nowrap"
                onClick={() => handleSort('status')}
              >
                <span>Trạng Thái</span>
                {renderSortIcon('status')}
              </th>

              {/* Created Date */}
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition whitespace-nowrap"
                onClick={() => handleSort('createdAt')}
              >
                <span>Ngày Tạo</span>
                {renderSortIcon('createdAt')}
              </th>

              {/* Actions Header */}
              <th className="py-3 px-4 text-right w-16">
                <span>Thao Tác</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {paginatedContacts.map((contact) => {
              const isSelected = selectedIds.includes(contact.id)
              const initials =
                `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase() || 'C'

              return (
                <tr
                  key={contact.id}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                  }`}
                  onClick={() => onViewContact?.(contact)}
                >
                  {/* Checkbox */}
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={`contact-chk-${contact.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectRow(contact.id, !!checked)}
                      aria-label={`Chọn liên hệ ${contact.fullName}`}
                    />
                  </td>

                  {/* Name with Avatar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          contact.avatarColor || 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                        }`}
                      >
                        {initials}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {contact.fullName}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[220px]">{contact.email}</span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {contact.company ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{contact.company}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Lists */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 flex-wrap max-w-xs">
                      {contact.lists.slice(0, 2).map((l, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-medium truncate max-w-[120px]"
                        >
                          {l}
                        </span>
                      ))}
                      {contact.lists.length > 2 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{contact.lists.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 flex-wrap max-w-xs">
                      {contact.tags.slice(0, 2).map((t, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-[10px] font-bold"
                        >
                          #{t}
                        </span>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <ContactStatusBadge status={contact.status} size="sm" />
                  </td>

                  {/* Created At */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {contact.createdAt}
                  </td>

                  {/* Row Actions */}
                  <td className="py-3 px-4 text-right">
                    <ContactRowActions
                      contact={contact}
                      onView={onViewContact}
                      onEdit={onEditContact}
                      onAddToList={onAddToList}
                      onDelete={onDeleteContact}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:px-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Range and Page Size Selector */}
        <div className="flex items-center gap-3 text-slate-500">
          <div>
            Hiển thị <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalItems === 0 ? 0 : startIndex + 1}</strong> -{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {Math.min(startIndex + activePageSize, totalItems)}
            </strong>{' '}
            trong tổng số <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalItems}</strong> liên hệ
          </div>

          <div className="flex items-center gap-1.5">
            <span>/ trang:</span>
            <select
              value={activePageSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value)
                if (serverPagination) {
                  serverPagination.onPageSizeChange(nextSize)
                  return
                }
                setPageSize(nextSize)
                setCurrentPage(1)
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 focus-ring cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Right: Pagination Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="p-1.5 h-8 w-8 justify-center"
            disabled={activePage === 0}
            onClick={() => (serverPagination ? serverPagination.onPageChange(0) : setCurrentPage(1))}
            title="Trang đầu"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="p-1.5 h-8 w-8 justify-center"
            disabled={activePage === 0}
            onClick={() =>
              serverPagination
                ? serverPagination.onPageChange(Math.max(0, activePage - 1))
                : setCurrentPage(currentPage - 1)
            }
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <span className="px-3 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
            Trang <strong>{activePage + 1}</strong> / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="p-1.5 h-8 w-8 justify-center"
            disabled={activePage >= totalPages - 1}
            onClick={() =>
              serverPagination
                ? serverPagination.onPageChange(Math.min(totalPages - 1, activePage + 1))
                : setCurrentPage(currentPage + 1)
            }
            title="Trang tiếp"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="p-1.5 h-8 w-8 justify-center"
            disabled={activePage >= totalPages - 1}
            onClick={() =>
              serverPagination
                ? serverPagination.onPageChange(totalPages - 1)
                : setCurrentPage(totalPages)
            }
            title="Trang cuối"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ContactTable
