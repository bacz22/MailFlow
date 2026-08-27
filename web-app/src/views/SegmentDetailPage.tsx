import React, { useState } from 'react'
import {
  ArrowLeft,
  Filter,
  Edit3,
  Trash2,
  Download,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { ContactTable } from '../components/contacts/ContactTable'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import type { Contact } from '../types/contact.types'

const SAMPLE_MATCHED_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    firstName: 'Thành',
    lastName: 'Nguyễn Văn',
    fullName: 'Nguyễn Văn Thành',
    email: 'thanh.nguyen@vcorp.vn',
    company: 'V-Corp Global',
    phone: '+84 912 345 678',
    lists: ['VIP Enterprise'],
    tags: ['Customer', 'VIP', 'High Value'],
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
    lists: ['VIP Enterprise'],
    tags: ['Customer', 'VIP', 'Decision Maker'],
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
    lists: ['VIP Enterprise'],
    tags: ['Customer', 'VIP', 'Engaged'],
    status: 'active',
    createdAt: '14/08/2026',
    updatedAt: '23/08/2026',
    avatarColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  },
]

export interface SegmentDetailPageProps {
  segmentId: string
  onNavigate: (path: string) => void
}

export const SegmentDetailPage: React.FC<SegmentDetailPageProps> = ({
  segmentId,
  onNavigate,
}) => {
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>(SAMPLE_MATCHED_CONTACTS)

  const segmentInfo = {
    id: segmentId || 'seg-1',
    name: 'Khách Hàng Doanh Nghiệp VIP (Hà Nội)',
    description: 'Tự động lọc các liên hệ tại khu vực Hà Nội có gắn thẻ VIP và trạng thái Active.',
    contactCount: 2315,
    matchLogic: 'and',
    conditions: [
      { field: 'city', operator: '=', value: 'Hà Nội' },
      { field: 'tags', operator: 'contains', value: 'VIP' },
      { field: 'status', operator: '=', value: 'Active' },
    ],
    updatedAt: '25/08/2026 lúc 10:30 (Realtime synced)',
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

  const handleDeleteSegment = () => {
    showToast({
      type: 'warning',
      title: 'Đã xóa phân đoạn',
      description: `Đã xóa phân đoạn "${segmentInfo.name}".`,
    })
    onNavigate('/segments')
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate('/segments')}
        >
          Quay Lại Phân Đoạn
        </Button>
      </div>

      {/* 2. SEGMENT HERO HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20 shadow-xs">
              <Filter className="w-6 h-6" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  {segmentInfo.name}
                </h1>
                <Badge variant="default" className="text-xs font-mono font-bold bg-violet-600">
                  {segmentInfo.contactCount.toLocaleString()} Contacts
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  • {segmentInfo.updatedAt}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">{segmentInfo.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGate permission={PERMISSIONS.SEGMENT_UPDATE}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => onNavigate(`/segments/${segmentInfo.id}/edit`)}
              >
                Chỉnh Sửa Điều Kiện
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.CONTACT_EXPORT}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() =>
                  showToast({
                    type: 'success',
                    title: 'Xuất CSV',
                    description: `Đang tải 2,315 liên hệ trong phân đoạn ${segmentInfo.name}...`,
                  })
                }
              >
                Xuất CSV
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.SEGMENT_DELETE}>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleDeleteSegment}
              >
                Xóa
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Condition Formula Banner */}
        <div className="p-3.5 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Điều kiện khớp (TẤT CẢ):</span>
            <div className="flex items-center gap-1.5 flex-wrap font-mono">
              {segmentInfo.conditions.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-700 font-bold text-violet-700 dark:text-violet-300"
                >
                  {c.field} {c.operator} "{c.value}"
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tự động đồng bộ thời gian thực</span>
          </div>
        </div>
      </div>

      {/* 3. MATCHED AUDIENCE CONTACT TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Danh Bạ Khách Hàng Khớp Điều Kiện
          </h2>
          <span className="text-xs text-slate-400">
            Hiển thị các liên hệ mẫu đang thỏa mãn bộ lọc
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
              title: 'Đã xóa liên hệ',
              description: `Đã xóa ${c.fullName}`,
            })
          }}
        />
      </div>
    </div>
  )
}

export default SegmentDetailPage
