import React, { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Layers,
  UserPlus,
  Trash2,
  Users,
  CheckCircle2,
  UserX,
  Upload,
  Edit3,
} from 'lucide-react'
import { ContactTable } from '../components/contacts/ContactTable'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { listService } from '../services/list.service'
import type { Contact } from '../types/contact.types'
import type { AudienceList } from '../types/list.types'

export interface ListDetailPageProps {
  listId: string
  onNavigate: (path: string) => void
}

export const ListDetailPage: React.FC<ListDetailPageProps> = ({ listId, onNavigate }) => {
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [listInfo, setListInfo] = useState<AudienceList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [list, members] = await Promise.all([
        listService.get(listId),
        listService.listContacts(listId, { page, size: pageSize }),
      ])
      setListInfo(list)
      setContacts(members.content)
      setTotalElements(members.totalElements)
      setTotalPages(Math.max(1, members.totalPages))
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được danh sách',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      onNavigate('/lists')
    } finally {
      setIsLoading(false)
    }
  }, [listId, onNavigate, page, pageSize, showToast])

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

  const handleRemoveFromList = async (contact: Contact) => {
    if (!window.confirm(`Gỡ ${contact.fullName} khỏi danh sách? Liên hệ vẫn được giữ trong danh bạ.`)) {
      return
    }
    try {
      await listService.removeMember(listId, contact.id)
      setSelectedIds((prev) => prev.filter((id) => id !== contact.id))
      await load()
      showToast({
        type: 'info',
        title: 'Đã xóa khỏi danh sách',
        description: `Đã loại ${contact.fullName} khỏi danh sách ${listInfo?.name ?? ''}`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không gỡ được liên hệ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleDeleteList = async () => {
    if (!listInfo) return
    if (!window.confirm(`Xóa danh sách "${listInfo.name}"? Liên hệ vẫn được giữ trong danh bạ.`)) {
      return
    }
    try {
      await listService.delete(listId)
      showToast({
        type: 'warning',
        title: 'Đã xóa danh sách',
        description: `Đã xóa danh sách "${listInfo.name}". Các liên hệ vẫn được giữ trong danh bạ chung.`,
      })
      onNavigate('/lists')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được danh sách',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  if (!listInfo) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        {isLoading ? 'Đang tải danh sách...' : 'Không tìm thấy danh sách.'}
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
          onClick={() => onNavigate('/lists')}
        >
          Quay Lại Danh Sách Gửi
        </Button>
      </div>

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

          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGate permission={PERMISSIONS.CONTACT_CREATE}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => onNavigate(`/contacts/create?listId=${listId}`)}
              >
                Thêm Liên Hệ
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.CONTACT_IMPORT}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => onNavigate(`/contacts/import?listId=${listId}`)}
              >
                Import CSV
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.LIST_UPDATE}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => onNavigate(`/lists/${listId}/edit`)}
              >
                Chỉnh Sửa
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.LIST_DELETE}>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => void handleDeleteList()}
              >
                Xóa Danh Sách
              </Button>
            </PermissionGate>
          </div>
        </div>

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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Danh Bạ Thành Viên Trong Danh Sách
          </h2>
          <span className="text-xs text-slate-400">
            {totalElements.toLocaleString('vi-VN')} liên hệ
          </span>
        </div>

        <ContactTable
          contacts={contacts}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAllPage={handleSelectAllPage}
          isLoading={isLoading}
          onViewContact={(c) => onNavigate(`/contacts/${c.id}`)}
          onEditContact={(c) => onNavigate(`/contacts/${c.id}/edit`)}
          onDeleteContact={(c) => void handleRemoveFromList(c)}
          deleteLabel="Gỡ khỏi danh sách"
          deletePermission={PERMISSIONS.LIST_UPDATE}
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

export default ListDetailPage
