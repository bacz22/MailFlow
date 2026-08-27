import React, { useState, useMemo } from 'react'
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
import { MetricWidget } from '../components/dashboard/MetricWidget'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { PermissionGate, PERMISSIONS, usePermission } from '../permissions'
import { useToast } from '../components/ui/Toast'
import type { Contact, ContactFilterState } from '../types/contact.types'

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    firstName: 'Thành',
    lastName: 'Nguyễn Văn',
    fullName: 'Nguyễn Văn Thành',
    email: 'thanh.nguyen@vcorp.vn',
    company: 'V-Corp Global',
    phone: '+84 912 345 678',
    lists: ['VIP Enterprise', 'Newsletter Subscribers'],
    tags: ['Customer', 'High Value'],
    status: 'active',
    createdAt: '15/08/2026',
    updatedAt: '24/08/2026',
    avatarColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  {
    id: 'cnt-2',
    firstName: 'Anh',
    lastName: 'Trần Minh',
    fullName: 'Trần Minh Anh',
    email: 'minhanh.tran@techlead.io',
    company: 'TechLead Solutions',
    phone: '+84 988 123 456',
    lists: ['Webinar Leads', 'Trial Users'],
    tags: ['Lead', 'Engaged'],
    status: 'active',
    createdAt: '18/08/2026',
    updatedAt: '25/08/2026',
    avatarColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  },
  {
    id: 'cnt-3',
    firstName: 'Hương',
    lastName: 'Phạm Thu',
    fullName: 'Phạm Thu Hương',
    email: 'huong.pham@fintech.asia',
    company: 'Fintech Asia Hub',
    phone: '+84 903 555 789',
    lists: ['VIP Enterprise'],
    tags: ['Customer', 'Decision Maker'],
    status: 'active',
    createdAt: '10/08/2026',
    updatedAt: '22/08/2026',
    avatarColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  {
    id: 'cnt-4',
    firstName: 'Huy',
    lastName: 'Lê Quang',
    fullName: 'Lê Quang Huy',
    email: 'huy.le@retailgroup.com',
    company: 'Retail Group VN',
    phone: '+84 934 999 888',
    lists: ['Newsletter Subscribers'],
    tags: ['Lead'],
    status: 'unsubscribed',
    createdAt: '02/08/2026',
    updatedAt: '20/08/2026',
    avatarColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  {
    id: 'cnt-5',
    firstName: 'Đức',
    lastName: 'Hoàng Minh',
    fullName: 'Hoàng Minh Đức',
    email: 'duc.hoang@logistics247.com',
    company: 'Logistics 24/7',
    phone: '+84 977 444 333',
    lists: ['Webinar Leads'],
    tags: ['Bounced'],
    status: 'bounced',
    createdAt: '12/08/2026',
    updatedAt: '19/08/2026',
    avatarColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  },
  {
    id: 'cnt-6',
    firstName: 'Mai',
    lastName: 'Vũ Ngọc',
    fullName: 'Vũ Ngọc Mai',
    email: 'mai.vu@designstudio.co',
    company: 'Creative Studio',
    phone: '+84 918 222 111',
    lists: ['Newsletter Subscribers', 'Trial Users'],
    tags: ['Trial', 'High Value'],
    status: 'active',
    createdAt: '20/08/2026',
    updatedAt: '25/08/2026',
    avatarColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  },
  {
    id: 'cnt-7',
    firstName: 'Bảo',
    lastName: 'Đỗ Quốc',
    fullName: 'Đỗ Quốc Bảo',
    email: 'invalid-email-address@domain',
    company: 'Agency Media',
    phone: '+84 909 000 111',
    lists: ['Trial Users'],
    tags: ['Invalid'],
    status: 'invalid',
    createdAt: '05/08/2026',
    updatedAt: '12/08/2026',
    avatarColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  {
    id: 'cnt-8',
    firstName: 'Trang',
    lastName: 'Bùi Thùy',
    fullName: 'Bùi Thùy Trang',
    email: 'trang.bui@ecomviet.vn',
    company: 'EcomViet Mart',
    phone: '+84 982 777 666',
    lists: ['VIP Enterprise', 'Newsletter Subscribers'],
    tags: ['Customer', 'Engaged'],
    status: 'active',
    createdAt: '14/08/2026',
    updatedAt: '23/08/2026',
    avatarColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  },
  {
    id: 'cnt-9',
    firstName: 'Nam',
    lastName: 'Phan Văn',
    fullName: 'Phan Văn Nam',
    email: 'nam.phan@spambot.net',
    company: 'Unknown',
    phone: '+84 931 111 222',
    lists: ['Newsletter Subscribers'],
    tags: ['Blocked', 'Spam Risk'],
    status: 'blocked',
    createdAt: '01/08/2026',
    updatedAt: '05/08/2026',
    avatarColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  {
    id: 'cnt-10',
    firstName: 'Lan',
    lastName: 'Dương Thị',
    fullName: 'Dương Thị Lan',
    email: 'lan.duong@hospitality.vn',
    company: 'Hospitality Luxury',
    phone: '+84 945 666 999',
    lists: ['VIP Enterprise'],
    tags: ['Customer'],
    status: 'active',
    createdAt: '16/08/2026',
    updatedAt: '24/08/2026',
    avatarColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300',
  },
  {
    id: 'cnt-11',
    firstName: 'Tuấn',
    lastName: 'Võ Anh',
    fullName: 'Võ Anh Tuấn',
    email: 'tuan.vo@saascloud.com',
    company: 'Cloud Scale Tech',
    phone: '+84 919 888 777',
    lists: ['Webinar Leads', 'Trial Users'],
    tags: ['Lead', 'Decision Maker'],
    status: 'active',
    createdAt: '22/08/2026',
    updatedAt: '25/08/2026',
    avatarColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  {
    id: 'cnt-12',
    firstName: 'Hà',
    lastName: 'Ngô Thanh',
    fullName: 'Ngô Thanh Hà',
    email: 'ha.ngo@edutech.vn',
    company: 'EduTech Academy',
    phone: '+84 966 333 444',
    lists: ['Newsletter Subscribers'],
    tags: ['Customer'],
    status: 'active',
    createdAt: '11/08/2026',
    updatedAt: '21/08/2026',
    avatarColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  },
]

export interface ContactsPageProps {
  onNavigate?: (path: string) => void
}

export const ContactsPage: React.FC<ContactsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { roleMetadata } = usePermission()

  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [filters, setFilters] = useState<ContactFilterState>({
    searchQuery: '',
    selectedList: 'all',
    selectedTag: 'all',
    selectedStatus: 'all',
  })

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase()
        const matchName = c.fullName.toLowerCase().includes(q)
        const matchEmail = c.email.toLowerCase().includes(q)
        const matchCompany = c.company?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchCompany) return false
      }

      // Status
      if (filters.selectedStatus !== 'all' && c.status !== filters.selectedStatus) {
        return false
      }

      // List
      if (filters.selectedList !== 'all' && !c.lists.includes(filters.selectedList)) {
        return false
      }

      // Tag
      if (filters.selectedTag !== 'all' && !c.tags.includes(filters.selectedTag)) {
        return false
      }

      return true
    })
  }, [contacts, filters])

  // Selection handlers
  const handleSelectRow = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleSelectAllPage = (selected: boolean) => {
    if (selected) {
      const pageIds = filteredContacts.slice(0, 10).map((c) => c.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    } else {
      const pageIds = filteredContacts.slice(0, 10).map((c) => c.id)
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    }
  }

  // Row action handlers
  const handleViewContact = (contact: Contact) => {
    if (onNavigate) {
      onNavigate(`/contacts/${contact.id}`)
    } else {
      showToast({
        type: 'info',
        title: 'Hồ sơ liên hệ',
        description: `Đang mở chi tiết của: ${contact.fullName} (${contact.email})`,
      })
    }
  }

  const handleEditContact = (contact: Contact) => {
    if (onNavigate) {
      onNavigate(`/contacts/${contact.id}/edit`)
    } else {
      showToast({
        type: 'info',
        title: 'Chỉnh sửa liên hệ',
        description: `Mở trình chỉnh sửa thông tin cho ${contact.fullName}`,
      })
    }
  }

  const handleAddToList = (contact: Contact) => {
    showToast({
      type: 'success',
      title: 'Đã thêm vào danh sách',
      description: `Đã cập nhật danh sách cho liên hệ ${contact.fullName}`,
    })
  }

  const handleDeleteContact = (contact: Contact) => {
    setContacts((prev) => prev.filter((c) => c.id !== contact.id))
    setSelectedIds((prev) => prev.filter((id) => id !== contact.id))
    showToast({
      type: 'warning',
      title: 'Đã xóa liên hệ',
      description: `Đã xóa vĩnh viễn ${contact.fullName} khỏi danh bạ.`,
    })
  }

  // Bulk action handlers
  const handleBulkDelete = () => {
    setContacts((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
    showToast({
      type: 'warning',
      title: 'Xóa hàng loạt thành công',
      description: `Đã xóa ${selectedIds.length} liên hệ đã chọn.`,
    })
    setSelectedIds([])
  }

  const handleBulkExport = () => {
    showToast({
      type: 'success',
      title: 'Đang xuất dữ liệu',
      description: `Đã xuất ${selectedIds.length} liên hệ ra file contacts_export.csv`,
    })
  }

  const isSearchFiltered =
    filters.searchQuery !== '' ||
    filters.selectedList !== 'all' ||
    filters.selectedTag !== 'all' ||
    filters.selectedStatus !== 'all'

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Danh Bạ Liên Hệ (Audience Contacts)"
        description="Quản lý toàn bộ danh sách người nhận, theo dõi điểm tương tác và trạng thái đăng ký chuẩn RFC 8058."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs font-mono font-bold">
              14,250 Contacts
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
              onClick={() =>
                showToast({
                  type: 'info',
                  title: 'Đã cập nhật',
                  description: 'Đã đồng bộ dữ liệu mới nhất từ server.',
                })
              }
            >
              Làm Mới
            </Button>

            {/* Export Action */}
            <PermissionGate
              permission={PERMISSIONS.CONTACT_EXPORT}
              renderDisabled
              disabledTooltip="Cần quyền CONTACT_EXPORT để tải dữ liệu"
            >
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() =>
                  showToast({
                    type: 'success',
                    title: 'Xuất toàn bộ CSV',
                    description: 'Đang tải file danh bạ 14,250 contacts...',
                  })
                }
              >
                Xuất CSV
              </Button>
            </PermissionGate>

            {/* Import Action */}
            <PermissionGate
              permission={PERMISSIONS.CONTACT_IMPORT}
              renderDisabled
              disabledTooltip="Cần quyền CONTACT_IMPORT để nạp file"
            >
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('/contacts/import')
                  } else {
                    showToast({
                      type: 'info',
                      title: 'Import CSV',
                      description: 'Mở trình tải file danh bạ hàng loạt.',
                    })
                  }
                }}
              >
                Import CSV
              </Button>
            </PermissionGate>

            {/* Create Contact Action */}
            <PermissionGate
              permission={PERMISSIONS.CONTACT_CREATE}
              renderDisabled
              disabledTooltip="Bạn không có quyền tạo liên hệ (CONTACT_CREATE)"
            >
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('/contacts/create')
                  } else {
                    showToast({
                      type: 'info',
                      title: 'Thêm Liên Hệ',
                      description: 'Mở biểu mẫu thêm liên hệ mới.',
                    })
                  }
                }}
              >
                Thêm Liên Hệ
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* READONLY BANNER */}
      <ReadOnlyBanner resourceName="danh bạ liên hệ" />

      {/* 2. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Tổng Liên Hệ Hợp Lệ"
          value="14,250"
          change="+8.4%"
          trend="up"
          trendLabel="so với tháng trước"
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          sparklineData={[11200, 11800, 12500, 13100, 13700, 14250]}
        />
        <MetricWidget
          label="Đang Hoạt Động (Active)"
          value="13,820"
          change="97.0%"
          trend="up"
          trendLabel="đã xác thực email"
          icon={<UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          sparklineData={[11600, 12200, 12700, 13400, 13820]}
        />
        <MetricWidget
          label="Hủy Đăng Ký (RFC 8058)"
          value="240"
          change="0.04%"
          trend="down"
          trendLabel="tỷ lệ rất an toàn"
          icon={<UserX className="w-5 h-5 text-slate-500" />}
          iconBgColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          sparklineData={[0.08, 0.06, 0.05, 0.04]}
        />
        <MetricWidget
          label="Bounced / Không Hợp Lệ"
          value="190"
          change="1.33%"
          trend="neutral"
          trendLabel="cần dọn dẹp định kỳ"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          iconBgColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          sparklineData={[120, 140, 160, 175, 190]}
        />
      </div>

      {/* 3. Floating Bulk Action Bar (Appears when rows are selected) */}
      <ContactBulkActions
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onAddToList={() =>
          showToast({
            type: 'info',
            title: 'Thêm vào danh sách',
            description: `Gán ${selectedIds.length} liên hệ vào danh sách mới`,
          })
        }
        onAddTag={() =>
          showToast({
            type: 'info',
            title: 'Gán thẻ Tag',
            description: `Gán thẻ nhãn cho ${selectedIds.length} liên hệ`,
          })
        }
        onExportSelected={handleBulkExport}
        onDeleteSelected={handleBulkDelete}
      />

      {/* 4. Filter Toolbar */}
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
        totalCount={contacts.length}
        filteredCount={filteredContacts.length}
      />

      {/* 5. Enterprise Data Table */}
      <ContactTable
        contacts={filteredContacts}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAllPage={handleSelectAllPage}
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
        onDeleteContact={handleDeleteContact}
      />
    </div>
  )
}

export default ContactsPage
