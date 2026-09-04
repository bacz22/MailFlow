import React, { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  User,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardFooter } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/Dialog'
import { Pagination } from '../components/ui/Pagination'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/DropdownMenu'
import { TemplatePreviewDialog } from '../components/templates/TemplatePreviewDialog'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { SimpleSelect, type SelectOption } from '../components/ui/Select'
import { templateService } from '../services/template.service'
import type { EmailTemplate } from '../types/template.types'

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'published', label: 'Đã phát hành (Published)' },
  { value: 'draft', label: 'Bản nháp (Draft)' },
  { value: 'archived', label: 'Đã lưu trữ (Archived)' },
]

const CATEGORY_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả phân loại' },
  { value: 'Product', label: 'Product Launch' },
  { value: 'Newsletter', label: 'Newsletter' },
  { value: 'Promotional', label: 'Promotional' },
  { value: 'Onboarding', label: 'Onboarding' },
  { value: 'Transactional', label: 'Transactional' },
]

export interface TemplatesPageProps {
  onNavigate: (path: string) => void
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await templateService.list({
        q: searchQuery.trim() || undefined,
        status: statusFilter,
        category: categoryFilter,
      })
      setTemplates(data)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được mẫu email',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, categoryFilter, showToast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTemplates()
    }, searchQuery ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadTemplates, searchQuery])

  const handleDuplicate = async (tpl: EmailTemplate) => {
    try {
      const duplicated = await templateService.duplicate(tpl.id)
      setTemplates((prev) => [duplicated, ...prev.filter((t) => t.id !== duplicated.id)])
      showToast({
        type: 'success',
        title: 'Đã nhân bản mẫu email',
        description: `Đã tạo bản sao "${duplicated.name}".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không nhân bản được mẫu',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      await templateService.delete(deleting.id)
      setTemplates((prev) => prev.filter((t) => t.id !== deleting.id))
      showToast({
        type: 'warning',
        title: 'Đã xóa mẫu email',
        description: `Đã xóa mẫu "${deleting.name}".`,
      })
      setDeleting(null)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được mẫu',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const totalItems = templates.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedTemplates = templates.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Thư Viện Mẫu Email (Email Templates)"
        description="Quản lý và tái sử dụng các mẫu email responsive chuẩn HTML, tương thích 100% các ứng dụng email (Gmail, Outlook, Apple Mail)."
        badge={
          <Badge variant="default" className="text-xs font-mono font-bold">
            {templates.length} Mẫu Email
          </Badge>
        }
        actions={
          <PermissionGate
            permission={PERMISSIONS.TEMPLATE_CREATE}
            renderDisabled
            disabledTooltip="Bạn không có quyền tạo mẫu email (TEMPLATE_CREATE)"
          >
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('/templates/create')}
            >
              Tạo Mẫu Mới
            </Button>
          </PermissionGate>
        }
      />

      {/* READONLY BANNER */}
      <ReadOnlyBanner resourceName="mẫu email" />

      {/* 2. Filters Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm theo tên mẫu, tiêu đề email..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dropdowns & View Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {/* Status Filter */}
          <div className="w-52">
            <SimpleSelect
              size="sm"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              className="rounded-xl font-semibold"
            />
          </div>

          {/* Category Filter */}
          <div className="w-44">
            <SimpleSelect
              size="sm"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={CATEGORY_FILTER_OPTIONS}
              className="rounded-xl font-semibold"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Dạng lưới thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Dạng bảng"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. TEMPLATES GRID VIEW */}
      {isLoading ? (
        <div className="text-sm text-slate-500 py-10 text-center">Đang tải mẫu email...</div>
      ) : templates.length === 0 ? (
        <div className="text-sm text-slate-500 py-10 text-center">
          Chưa có mẫu email nào. Tạo mẫu đầu tiên để tái sử dụng nội dung chiến dịch.
        </div>
      ) : viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTemplates.map((template) => (
            <Card
              key={template.id}
              className="overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between border-slate-200/90 dark:border-slate-800/90"
            >
              {/* Thumbnail Simulated Banner */}
              <div
                className={`h-36 p-4 relative flex flex-col justify-between cursor-pointer ${
                  template.thumbnailGradient || 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                }`}
                onClick={() => setPreviewTemplate(template)}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {template.category}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      template.status === 'published'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {template.status === 'published' ? 'Sẵn Sàng' : 'Bản Nháp'}
                  </span>
                </div>

                <div className="text-white space-y-0.5">
                  <div className="font-bold text-sm line-clamp-1 group-hover:underline">
                    {template.name}
                  </div>
                  <div className="text-[11px] text-white/80 line-clamp-1">
                    {template.subject}
                  </div>
                </div>

                {/* Quick preview hover overlay */}
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xem Trước Email</span>
                  </span>
                </div>
              </div>

              {/* Card Meta Body */}
              <CardContent className="p-4 space-y-3">
                <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {template.previewText || 'Mẫu thiết kế email marketing responsive chuẩn MailFlow.'}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{template.createdBy}</span>
                  </div>
                  <span>{template.updatedAt}</span>
                </div>
              </CardContent>

              {/* Card Footer Actions */}
              <CardFooter className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                {/* More Dropdown */}
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
                    <PermissionGate permission={PERMISSIONS.TEMPLATE_UPDATE}>
                      <DropdownMenuItem onClick={() => onNavigate(`/templates/${template.id}/edit`)}>
                        <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                        <span>Chỉnh sửa</span>
                      </DropdownMenuItem>
                    </PermissionGate>

                    <PermissionGate permission={PERMISSIONS.TEMPLATE_CREATE}>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                        <span>Nhân bản</span>
                      </DropdownMenuItem>
                    </PermissionGate>

                    <PermissionGate permission={PERMISSIONS.TEMPLATE_DELETE}>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleting({ id: template.id, name: template.name })}
                        className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        <span>Xóa mẫu</span>
                      </DropdownMenuItem>
                    </PermissionGate>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 4. TEMPLATES TABLE VIEW */}
      {!isLoading && templates.length > 0 && viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Tên Mẫu & Tiêu Đề</th>
                  <th className="py-3 px-3">Phân Loại</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3">Người Tạo</th>
                  <th className="py-3 px-3">Cập Nhật</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition cursor-pointer"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{template.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{template.subject}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        {template.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          template.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {template.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {template.createdBy}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{template.updatedAt}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                          <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                            <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                            <span>Xem trước</span>
                          </DropdownMenuItem>

                          <PermissionGate permission={PERMISSIONS.TEMPLATE_UPDATE}>
                            <DropdownMenuItem onClick={() => onNavigate(`/templates/${template.id}/edit`)}>
                              <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                          </PermissionGate>

                          <PermissionGate permission={PERMISSIONS.TEMPLATE_CREATE}>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                              <span>Nhân bản</span>
                            </DropdownMenuItem>
                          </PermissionGate>

                          <PermissionGate permission={PERMISSIONS.TEMPLATE_DELETE}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleting({ id: template.id, name: template.name })}
                              className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              <span>Xóa mẫu</span>
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Pagination Footer */}
      {!isLoading && totalItems > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24, 48]}
            itemLabel="mẫu email"
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </div>
      )}

      {/* 5. Preview Dialog Modal */}
      <TemplatePreviewDialog
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={(t) => {
          showToast({
            type: 'success',
            title: 'Đã chọn mẫu',
            description: `Áp dụng mẫu "${t.name}" vào chiến dịch mới.`,
          })
          onNavigate('/campaigns')
        }}
      />

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleting(null)
          }
        }}
        title={`Xóa mẫu "${deleting?.name ?? ''}"?`}
        description="Mẫu email sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
        confirmText="Xóa mẫu"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

export default TemplatesPage
