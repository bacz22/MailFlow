import React, { useState } from 'react'
import {
  ArrowLeft,
  Layers,
  UserPlus,
  Trash2,
  Users,
  CheckCircle2,
  UserX,
  Upload,
} from 'lucide-react'
import { ContactTable } from '../components/contacts/ContactTable'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import type { Contact } from '../types/contact.types'

const SAMPLE_LIST_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    firstName: 'Thành',
    lastName: 'Nguyễn Văn',
    fullName: 'Nguyễn Văn Thành',
    email: 'thanh.nguyen@vcorp.vn',
    company: 'V-Corp Global',
    phone: '+84 912 345 678',
    lists: ['VIP Enterprise Clients'],
    tags: ['Customer', 'High Value'],
    status: 'active',
    createdAt: '15/08/2026',
    updatedAt: '24/08/2026',
    avatarColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  {
    id: 'cnt-3',
    firstName: 'Hương',
    lastName: 'Phạm Thu',
    fullName: 'Phạm Thu Hương',
    email: 'huong.pham@fintech.asia',
    company: 'Fintech Asia Hub',
    phone: '+84 903 555 789',
    lists: ['VIP Enterprise Clients'],
    tags: ['Customer', 'Decision Maker'],
    status: 'active',
    createdAt: '10/08/2026',
    updatedAt: '22/08/2026',
    avatarColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  {
    id: 'cnt-8',
    firstName: 'Trang',
    lastName: 'Bùi Thùy',
    fullName: 'Bùi Thùy Trang',
    email: 'trang.bui@ecomviet.vn',
    company: 'EcomViet Mart',
    phone: '+84 982 777 666',
    lists: ['VIP Enterprise Clients'],
    tags: ['Customer', 'Engaged'],
    status: 'active',
    createdAt: '14/08/2026',
    updatedAt: '23/08/2026',
    avatarColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  },
  {
    id: 'cnt-10',
    firstName: 'Lan',
    lastName: 'Dương Thị',
    fullName: 'Dương Thị Lan',
    email: 'lan.duong@hospitality.vn',
    company: 'Hospitality Luxury',
    phone: '+84 945 666 999',
    lists: ['VIP Enterprise Clients'],
    tags: ['Customer'],
    status: 'active',
    createdAt: '16/08/2026',
    updatedAt: '24/08/2026',
    avatarColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300',
  },
]

export interface ListDetailPageProps {
  listId: string
  onNavigate: (path: string) => void
}

export const ListDetailPage: React.FC<ListDetailPageProps> = ({ listId, onNavigate }) => {
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>(SAMPLE_LIST_CONTACTS)

  const listInfo = {
    id: listId || 'lst-1',
    name: 'VIP Enterprise Clients',
    description: 'Khách hàng doanh nghiệp trọng điểm gói hợp đồng trên $5,000/năm.',
    contactCount: 5420,
    activeCount: 5380,
    unsubscribedCount: 12,
    createdAt: '10/08/2026',
    updatedAt: '25/08/2026',
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
      setSelectedIds(contacts.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleDeleteList = () => {
    showToast({
      type: 'warning',
      title: 'Đã xóa danh sách',
      description: `Đã xóa danh sách "${listInfo.name}". Các liên hệ vẫn được giữ trong danh bạ chung.`,
    })
    onNavigate('/lists')
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate('/lists')}
        >
          Quay Lại Danh Sách Gửi
        </Button>
      </div>

      {/* 2. LIST HERO HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  {listInfo.name}
                </h1>
                <Badge variant="success" className="text-xs font-mono font-bold">
                  {listInfo.contactCount.toLocaleString()} Contacts
                </Badge>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">{listInfo.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGate permission={PERMISSIONS.CONTACT_CREATE}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('/contacts/create')}
              >
                Thêm Liên Hệ
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.CONTACT_IMPORT}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('/contacts/import')}
              >
                Import CSV
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.LIST_DELETE}>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleDeleteList}
              >
                Xóa Danh Sách
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* List KPI Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-[11px] text-slate-400">Tổng Thành Viên:</div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{listInfo.contactCount.toLocaleString()}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[11px] text-emerald-600">Đang Nhận Tin (Active):</div>
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{listInfo.activeCount.toLocaleString()}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
            <UserX className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[11px] text-slate-400">Hủy Nhận Tin (RFC 8058):</div>
              <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{listInfo.unsubscribedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REUSABLE CONTACT TABLE FOR THIS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Danh Bạ Thành Viên Trong Danh Sách
          </h2>
          <span className="text-xs text-slate-400">
            Hiển thị {contacts.length} liên hệ mẫu
          </span>
        </div>

        <ContactTable
          contacts={contacts}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAllPage={handleSelectAllPage}
          onViewContact={(c) => onNavigate(`/contacts/${c.id}`)}
          onEditContact={(c) => onNavigate(`/contacts/${c.id}/edit`)}
          onDeleteContact={(c) => {
            setContacts((prev) => prev.filter((item) => item.id !== c.id))
            showToast({
              type: 'info',
              title: 'Đã xóa khỏi danh sách',
              description: `Đã loại ${c.fullName} khỏi danh sách ${listInfo.name}`,
            })
          }}
        />
      </div>
    </div>
  )
}

export default ListDetailPage
