import React, { useCallback, useEffect, useState } from 'react'
import {
  Layers,
  Plus,
  Search,
  Users,
  Calendar,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Tag,
  LayoutGrid,
  List as ListIcon,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/Dialog'
import { TagManagerModal } from '../components/lists/TagManagerModal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/DropdownMenu'
import { PermissionGate, PERMISSIONS, usePermission } from '../permissions'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { listService } from '../services/list.service'
import { tagService } from '../services/tag.service'
import type { AudienceList, AudienceTag } from '../types/list.types'

export interface ListsPageProps {
  onNavigate: (path: string) => void
}

export const ListsPage: React.FC<ListsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const canReadList = hasPermission(PERMISSIONS.LIST_READ)
  const canUpdateList = hasPermission(PERMISSIONS.LIST_UPDATE)
  const canCreateList = hasPermission(PERMISSIONS.LIST_CREATE)
  const canDeleteList = hasPermission(PERMISSIONS.LIST_DELETE)
  const hasAnyListAction = canReadList || canUpdateList || canCreateList || canDeleteList

  const [lists, setLists] = useState<AudienceList[]>([])
  const [tags, setTags] = useState<AudienceTag[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingList, setDeletingList] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadLists = useCallback(async (q?: string) => {
    setIsLoading(true)
    try {
      const data = await listService.list(q)
      setLists(data)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được danh sách',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  const loadTags = useCallback(async () => {
    try {
      const data = await tagService.list()
      setTags(data)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được thẻ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }, [showToast])

  useEffect(() => {
    void loadTags()
  }, [loadTags])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadLists(searchQuery.trim() || undefined)
    }, 250)
    return () => window.clearTimeout(handle)
  }, [loadLists, searchQuery])

  const filteredLists = lists

  const handleDuplicate = async (list: AudienceList) => {
    try {
      const duplicated = await listService.duplicate(list.id)
      setLists((prev) => [duplicated, ...prev])
      showToast({
        type: 'success',
        title: 'Đã nhân bản danh sách',
        description: `Đã tạo bản sao "${duplicated.name}".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không nhân bản được danh sách',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDeletingList({ id, name })
  }

  const confirmDeleteList = async () => {
    if (!deletingList) return
    const { id, name } = deletingList
    setIsDeleting(true)
    try {
      await listService.delete(id)
      setLists((prev) => prev.filter((l) => l.id !== id))
      setDeletingList(null)
      showToast({
        type: 'warning',
        title: 'Đã xóa danh sách',
        description: `Đã xóa danh sách "${name}".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được danh sách',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Danh Sách Gửi (Audience Lists)"
        description="Tổ chức các tập hợp người nhận theo chiến dịch, nguồn đăng ký và phân khúc khách hàng."
        badge={
          <Badge variant="default" className="text-xs font-mono font-bold">
            {lists.length} Danh Sách
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tag Management Button */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Tag className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={() => setIsTagModalOpen(true)}
            >
              Quản Lý Thẻ ({tags.length})
            </Button>

            {/* Create List Button */}
            <PermissionGate
              permission={PERMISSIONS.LIST_CREATE}
              renderDisabled
              disabledTooltip="Bạn không có quyền tạo danh sách (LIST_CREATE)"
            >
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('/lists/create')}
              >
                Tạo Danh Sách
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* READONLY BANNER */}
      <ReadOnlyBanner resourceName="danh sách người nhận" />

      {/* 2. Top Tag Chips Showcase */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between gap-3 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-2 shrink-0">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Thẻ Phổ Biến:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {tags.length === 0 ? (
            <span className="text-xs text-slate-400">Chưa có thẻ — mở Quản Lý Thẻ để tạo hoặc đồng bộ.</span>
          ) : (
            tags.map((t) => (
              <span
                key={t.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${t.color}`}
              >
                <span>#{t.name}</span>
                <span className="opacity-70 text-[10px] font-mono">({t.contactCount})</span>
              </span>
            ))
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 dark:text-blue-400 shrink-0"
          onClick={() => setIsTagModalOpen(true)}
        >
          Chỉnh Sửa
        </Button>
      </div>

      {/* 3. Search Toolbar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm kiếm danh sách..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-400 hover:text-slate-700'
              }`}
            title="Dạng Lưới (Grid Cards)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'table'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-400 hover:text-slate-700'
              }`}
            title="Dạng Bảng (Table)"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. LISTS RENDER: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4">
          {isLoading && lists.length === 0 ? (
            <div className="col-span-full text-center text-sm text-slate-500 py-10">Đang tải danh sách...</div>
          ) : filteredLists.length === 0 ? (
            <div className="col-span-full text-center text-sm text-slate-500 py-10">
              Chưa có danh sách nào. Tạo danh sách đầu tiên để gom nhóm liên hệ.
            </div>
          ) : null}
          {filteredLists.map((list) => (
            <Card
              key={list.id}
              className="hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between border-slate-200/90 dark:border-slate-800/90"
              onClick={() => onNavigate(`/lists/${list.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {list.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-1 mt-0.5">
                        {list.description}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  {hasAnyListAction && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Tùy chọn khác"
                            aria-label="Tùy chọn khác"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          {canReadList && (
                            <DropdownMenuItem onClick={() => onNavigate(`/lists/${list.id}`)}>
                              <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                              <span>Xem chi tiết</span>
                            </DropdownMenuItem>
                          )}
                          <PermissionGate permission={PERMISSIONS.LIST_UPDATE}>
                            <DropdownMenuItem onClick={() => onNavigate(`/lists/${list.id}/edit`)}>
                              <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.LIST_CREATE}>
                            <DropdownMenuItem onClick={() => void handleDuplicate(list)}>
                              <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                              <span>Nhân bản</span>
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.LIST_DELETE}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => void handleDelete(list.id, list.name)}
                              className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              <span>Xóa</span>
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Stats Counter Bar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-400 font-semibold">Quy Mô Người Nhận</span>
                    <div className="text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{list.contactCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {list.activeCount.toLocaleString()} Active
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {list.unsubscribedCount} hủy nhận tin
                    </div>
                  </div>
                </div>

                {/* Tags attached to list */}
                {list.tags && list.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {list.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dates & Quick Enter */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Tạo: {list.createdAt}</span>
                  </div>

                  <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                    <span>Mở danh bạ</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 5. LISTS RENDER: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Tên Danh Sách</th>
                  <th className="py-3 px-3 text-right">Tổng Liên Hệ</th>
                  <th className="py-3 px-3 text-right">Đang Nhận Tin</th>
                  <th className="py-3 px-3">Thẻ Gắn Liền</th>
                  <th className="py-3 px-3">Ngày Tạo</th>
                  <th className="py-3 px-3">Cập Nhật</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLists.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      {isLoading ? 'Đang tải danh sách...' : 'Chưa có danh sách nào.'}
                    </td>
                  </tr>
                ) : null}
                {filteredLists.map((list) => (
                  <tr
                    key={list.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition cursor-pointer"
                    onClick={() => onNavigate(`/lists/${list.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{list.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{list.description}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {list.contactCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      {list.activeCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs">
                        {list.tags?.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{list.createdAt}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{list.updatedAt}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {hasAnyListAction && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Tùy chọn khác"
                              aria-label="Tùy chọn khác"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 text-xs">
                            {canReadList && (
                              <DropdownMenuItem onClick={() => onNavigate(`/lists/${list.id}`)}>
                                <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                <span>Xem chi tiết</span>
                              </DropdownMenuItem>
                            )}
                            <PermissionGate permission={PERMISSIONS.LIST_UPDATE}>
                              <DropdownMenuItem onClick={() => onNavigate(`/lists/${list.id}/edit`)}>
                                <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                                <span>Chỉnh sửa</span>
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate permission={PERMISSIONS.LIST_CREATE}>
                              <DropdownMenuItem onClick={() => void handleDuplicate(list)}>
                                <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                                <span>Nhân bản</span>
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate permission={PERMISSIONS.LIST_DELETE}>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => void handleDelete(list.id, list.name)}
                                className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                <span>Xóa</span>
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tag Manager Dialog */}
      <TagManagerModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={tags}
        onCreateTag={async (payload) => {
          const created = await tagService.create(payload)
          setTags((prev) => [created, ...prev])
        }}
        onRenameTag={async (tagId, name) => {
          const updated = await tagService.update(tagId, { name })
          setTags((prev) => prev.map((tag) => (tag.id === tagId ? updated : tag)))
        }}
        onDeleteTag={async (tagId) => {
          await tagService.delete(tagId)
          setTags((prev) => prev.filter((tag) => tag.id !== tagId))
        }}
        onSyncFromContacts={async () => {
          const result = await tagService.syncFromContacts()
          setTags(result.tags)
        }}
      />

      {/* Delete List Confirm Dialog */}
      <ConfirmDialog
        open={deletingList != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingList(null)
          }
        }}
        title={`Xóa danh sách "${deletingList?.name ?? ''}"?`}
        description="Các liên hệ trong danh sách này vẫn được giữ nguyên trong danh bạ chung. Hành động xóa danh sách không thể hoàn tác."
        confirmText="Xóa danh sách"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void confirmDeleteList()}
      />
    </div>
  )
}

export default ListsPage
