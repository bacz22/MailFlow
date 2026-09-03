import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Upload,
  Download,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import {
  ContactTable,
  ContactFilters,
  ContactBulkActions,
} from '../components/contacts'
import type { SortField, SortOrder } from '../components/contacts/ContactTable'
import { MetricWidget } from '../components/dashboard/MetricWidget'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { PermissionGate, PERMISSIONS, usePermission } from '../permissions'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { contactService, type ContactStats } from '../services/contact.service'
import type { Contact, ContactFilterState } from '../types/contact.types'

const EMPTY_STATS: ContactStats = {
  total: 0,
  active: 0,
  unsubscribed: 0,
  bounced: 0,
  invalid: 0,
  blocked: 0,
}

function formatCount(value: number): string {
  return value.toLocaleString('vi-VN')
}

export interface ContactsPageProps {
  onNavigate?: (path: string) => void
}

export const ContactsPage: React.FC<ContactsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { roleMetadata } = usePermission()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [stats, setStats] = useState<ContactStats>(EMPTY_STATS)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [filters, setFilters] = useState<ContactFilterState>({
    searchQuery: '',
    selectedList: 'all',
    selectedTag: 'all',
    selectedStatus: 'all',
  })

  const sortParam = useMemo(() => `${sortField},${sortOrder}`, [sortField, sortOrder])

  const loadStats = useCallback(async () => {
    try {
      const next = await contactService.stats()
      setStats(next)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được thống kê',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }, [showToast])

  const loadContacts = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await contactService.list({
        q: filters.searchQuery || undefined,
        status: filters.selectedStatus,
        tag: filters.selectedTag,
        page,
        size: pageSize,
        sort: sortParam,
      })
      setContacts(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(1, result.totalPages))
      setAvailableTags(result.availableTags)
    } catch (error) {
      setIsError(true)
      setErrorMessage(error instanceof ApiError ? error.detail : 'Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }, [filters.searchQuery, filters.selectedStatus, filters.selectedTag, page, pageSize, sortParam])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  useEffect(() => {
    setPage(0)
  }, [filters.searchQuery, filters.selectedStatus, filters.selectedTag, pageSize, sortParam])

  const handleRefresh = async () => {
    await Promise.all([loadStats(), loadContacts()])
    showToast({
      type: 'success',
      title: 'Đã cập nhật',
      description: 'Danh bạ đã được đồng bộ từ server.',
    })
  }

  const handleSelectRow = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleSelectAllPage = (selected: boolean) => {
    if (selected) {
      const pageIds = contacts.map((c) => c.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    } else {
      const pageIds = contacts.map((c) => c.id)
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    }
  }

  const handleViewContact = (contact: Contact) => {
    onNavigate?.(`/contacts/${contact.id}`)
  }

  const handleEditContact = (contact: Contact) => {
    onNavigate?.(`/contacts/${contact.id}/edit`)
  }

  const handleAddToList = () => {
    showToast({
      type: 'info',
      title: 'Sắp ra mắt',
      description: 'Gán danh sách sẽ có ở phase Lists.',
    })
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (!window.confirm(`Xóa vĩnh viễn liên hệ ${contact.fullName}?`)) {
      return
    }
    try {
      await contactService.delete(contact.id)
      setSelectedIds((prev) => prev.filter((id) => id !== contact.id))
      await Promise.all([loadStats(), loadContacts()])
      showToast({
        type: 'warning',
        title: 'Đã xóa liên hệ',
        description: `Đã xóa vĩnh viễn ${contact.fullName} khỏi danh bạ.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được liên hệ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.length
    if (!window.confirm(`Xóa vĩnh viễn ${count} liên hệ đã chọn?`)) {
      return
    }
    try {
      await contactService.bulkDelete(selectedIds)
      setSelectedIds([])
      await Promise.all([loadStats(), loadContacts()])
      showToast({
        type: 'warning',
        title: 'Xóa hàng loạt thành công',
        description: `Đã xóa ${count} liên hệ đã chọn.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được liên hệ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleBulkExport = async () => {
    try {
      await contactService.exportSelected(selectedIds)
      showToast({
        type: 'success',
        title: 'Đang xuất dữ liệu',
        description: `Đã xuất ${selectedIds.length} liên hệ ra file CSV.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xuất được dữ liệu',
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      })
    }
  }

  const handleBulkTag = async () => {
    const count = selectedIds.length
    const input = window.prompt('Nhập thẻ tag (phân cách bằng dấu phẩy):')
    if (!input) return
    const tags = input
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    if (tags.length === 0) return
    try {
      await contactService.bulkTags(selectedIds, tags)
      setSelectedIds([])
      await loadContacts()
      showToast({
        type: 'success',
        title: 'Đã gán thẻ',
        description: `Đã gán tag cho ${count} liên hệ.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không gán được thẻ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleExportAll = async () => {
    try {
      await contactService.exportFiltered({
        q: filters.searchQuery || undefined,
        status: filters.selectedStatus,
        tag: filters.selectedTag,
      })
      showToast({
        type: 'success',
        title: 'Xuất CSV thành công',
        description: 'File danh bạ đã được tải xuống.',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xuất được dữ liệu',
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      })
    }
  }

  const isSearchFiltered =
    filters.searchQuery !== '' ||
    filters.selectedList !== 'all' ||
    filters.selectedTag !== 'all' ||
    filters.selectedStatus !== 'all'

  const bouncedInvalidTotal = stats.bounced + stats.invalid + stats.blocked

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh Bạ Liên Hệ (Audience Contacts)"
        description="Quản lý toàn bộ danh sách người nhận, theo dõi điểm tương tác và trạng thái đăng ký chuẩn RFC 8058."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs font-mono font-bold">
              {formatCount(stats.total)} Contacts
            </Badge>
            <Badge variant={roleMetadata.badgeVariant} className="text-xs">
              {roleMetadata.name}
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => void handleRefresh()}
            >
              Làm Mới
            </Button>

            <PermissionGate
              permission={PERMISSIONS.CONTACT_EXPORT}
              renderDisabled
              disabledTooltip="Cần quyền CONTACT_EXPORT để tải dữ liệu"
            >
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => void handleExportAll()}
              >
                Xuất CSV
              </Button>
            </PermissionGate>

            <PermissionGate
              permission={PERMISSIONS.CONTACT_IMPORT}
              renderDisabled
              disabledTooltip="Cần quyền CONTACT_IMPORT để nạp file"
            >
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => onNavigate?.('/contacts/import')}
              >
                Import CSV
              </Button>
            </PermissionGate>

            <PermissionGate
              permission={PERMISSIONS.CONTACT_CREATE}
              renderDisabled
              disabledTooltip="Bạn không có quyền tạo liên hệ (CONTACT_CREATE)"
            >
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => onNavigate?.('/contacts/create')}
              >
                Thêm Liên Hệ
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <ReadOnlyBanner resourceName="danh bạ liên hệ" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Tổng Liên Hệ Hợp Lệ"
          value={formatCount(stats.total)}
          change="—"
          trend="neutral"
          trendLabel="trong workspace hiện tại"
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          sparklineData={[stats.total]}
        />
        <MetricWidget
          label="Đang Hoạt Động (Active)"
          value={formatCount(stats.active)}
          change={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 1000) / 10}%` : '0%'}
          trend="up"
          trendLabel="liên hệ active"
          icon={<UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          sparklineData={[stats.active]}
        />
        <MetricWidget
          label="Hủy Đăng Ký (RFC 8058)"
          value={formatCount(stats.unsubscribed)}
          change={stats.total > 0 ? `${Math.round((stats.unsubscribed / stats.total) * 1000) / 10}%` : '0%'}
          trend="down"
          trendLabel="đã hủy đăng ký"
          icon={<UserX className="w-5 h-5 text-slate-500" />}
          iconBgColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          sparklineData={[stats.unsubscribed]}
        />
        <MetricWidget
          label="Bounced / Không Hợp Lệ"
          value={formatCount(bouncedInvalidTotal)}
          change={stats.total > 0 ? `${Math.round((bouncedInvalidTotal / stats.total) * 1000) / 10}%` : '0%'}
          trend="neutral"
          trendLabel="cần dọn dẹp định kỳ"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          iconBgColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          sparklineData={[bouncedInvalidTotal]}
        />
      </div>

      <ContactBulkActions
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onAddToList={handleAddToList}
        onAddTag={() => void handleBulkTag()}
        onExportSelected={() => void handleBulkExport()}
        onDeleteSelected={() => void handleBulkDelete()}
      />

      <ContactFilters
        filters={filters}
        onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
        onClearFilters={() =>
          setFilters({
            searchQuery: '',
            selectedList: 'all',
            selectedTag: 'all',
            selectedStatus: 'all',
          })
        }
        totalCount={totalElements}
        filteredCount={contacts.length}
        availableLists={[]}
        availableTags={availableTags}
      />

      <ContactTable
        contacts={contacts}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAllPage={handleSelectAllPage}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        isSearchFiltered={isSearchFiltered}
        onClearFilters={() =>
          setFilters({
            searchQuery: '',
            selectedList: 'all',
            selectedTag: 'all',
            selectedStatus: 'all',
          })
        }
        onViewContact={handleViewContact}
        onEditContact={handleEditContact}
        onAddToList={handleAddToList}
        onDeleteContact={(contact) => void handleDeleteContact(contact)}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortField(field)
          setSortOrder(order)
        }}
        serverPagination={{
          page,
          pageSize,
          totalElements,
          totalPages,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(0)
          },
        }}
      />
    </div>
  )
}

export default ContactsPage
