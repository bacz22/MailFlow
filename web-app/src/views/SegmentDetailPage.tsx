import React, { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { ContactTable } from '../components/contacts/ContactTable'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { segmentService } from '../services/segment.service'
import type { Contact } from '../types/contact.types'
import type { DynamicSegment } from '../types/segment.types'

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
  const [contacts, setContacts] = useState<Contact[]>([])
  const [segment, setSegment] = useState<DynamicSegment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [meta, contactsPage] = await Promise.all([
        segmentService.get(segmentId),
        segmentService.listContacts(segmentId, { page, size: pageSize }),
      ])
      setSegment(meta)
      setContacts(contactsPage.content)
      setTotalElements(contactsPage.totalElements)
      setTotalPages(Math.max(1, contactsPage.totalPages))
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được phân đoạn',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      onNavigate('/segments')
    } finally {
      setIsLoading(false)
    }
  }, [segmentId, page, pageSize, onNavigate, showToast])

  useEffect(() => {
    void load()
  }, [load])

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

  const handleDeleteSegment = async () => {
    if (!segment) return
    try {
      await segmentService.delete(segment.id)
      showToast({
        type: 'warning',
        title: 'Đã xóa phân đoạn',
        description: `Đã xóa phân đoạn "${segment.name}".`,
      })
      onNavigate('/segments')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được phân đoạn',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  if (isLoading || !segment) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate('/segments')}
        >
          Quay Lại Phân Đoạn
        </Button>
        <div className="text-sm text-slate-500 py-10 text-center">Đang tải phân đoạn...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20 shadow-xs">
              <Filter className="w-6 h-6" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  {segment.name}
                </h1>
                <Badge variant="default" className="text-xs font-mono font-bold bg-violet-600">
                  {segment.contactCount.toLocaleString()} Contacts
                </Badge>
                <span className="text-xs text-slate-400 font-mono">• Cập nhật {segment.updatedAt}</span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">{segment.description || 'Không có mô tả'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGate permission={PERMISSIONS.SEGMENT_UPDATE}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => onNavigate(`/segments/${segment.id}/edit`)}
              >
                Chỉnh Sửa Điều Kiện
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.SEGMENT_DELETE}>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => void handleDeleteSegment()}
              >
                Xóa
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Điều kiện khớp ({segment.matchLogic === 'and' ? 'TẤT CẢ' : 'BẤT KỲ'}):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap font-mono">
              {segment.conditions.map((c) => (
                <span
                  key={c.id}
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Danh Bạ Khách Hàng Khớp Điều Kiện
          </h2>
          <span className="text-xs text-slate-400">
            {totalElements.toLocaleString('vi-VN')} liên hệ khớp
          </span>
        </div>

        <ContactTable
          contacts={contacts}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAllPage={handleSelectAllPage}
          onViewContact={(c) => onNavigate(`/contacts/${c.id}`)}
          onEditContact={(c) => onNavigate(`/contacts/${c.id}/edit`)}
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
    </div>
  )
}

export default SegmentDetailPage
