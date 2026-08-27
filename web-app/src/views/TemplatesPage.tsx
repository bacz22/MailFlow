import React, { useState } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/DropdownMenu'
import { TemplatePreviewDialog } from '../components/templates/TemplatePreviewDialog'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { PermissionGate, PERMISSIONS, usePermission } from '../permissions'
import { useToast } from '../components/ui/Toast'
import type { EmailTemplate } from '../types/template.types'

const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Product Launch 2.0 - Dark & Light Modern',
    subject: '🚀 Ra mắt MailFlow 2.0: Trải nghiệm email marketing đỉnh cao',
    previewText: 'Khám phá hạ tầng gửi 500,000 email/phút và tự động hóa RFC 8058 hoàn toàn mới.',
    category: 'Product',
    status: 'published',
    createdBy: 'Nguyễn Văn Editor',
    createdAt: '10/08/2026',
    updatedAt: '25/08/2026',
    thumbnailGradient: 'bg-gradient-to-tr from-blue-600 to-indigo-600',
    htmlContent: `
      <p>Xin chào <strong>{{firstName}}</strong>,</p>
      <p>Chúng tôi vô cùng hào hứng giới thiệu <strong>MailFlow 2.0</strong> — giải pháp gửi email hàng loạt với độ ổn định Inbox đạt 99.8%.</p>
      <p>Với hạ tầng Dedicated IP và chuẩn mã hóa DKIM tự động, doanh nghiệp <em>{{company}}</em> sẽ tối ưu hiệu suất chuyển đổi lên tới 300%.</p>
    `,
  },
  {
    id: 'tpl-2',
    name: 'Weekly Tech & SaaS Newsletter #48',
    subject: 'Bản tin hàng tuần: 5 mẹo tối ưu Inbox Rate với RFC 8058',
    previewText: 'Các chiến thuật tối ưu chiến dịch email marketing B2B không thể bỏ qua tuần này.',
    category: 'Newsletter',
    status: 'published',
    createdBy: 'Trần Minh Marketing',
    createdAt: '15/08/2026',
    updatedAt: '24/08/2026',
    thumbnailGradient: 'bg-gradient-to-tr from-emerald-600 to-teal-600',
    htmlContent: `
      <p>Chào <strong>{{firstName}}</strong>,</p>
      <p>Chào mừng bạn đến với bản tin số #48. Hôm nay chúng ta cùng phân tích cách cấu hình <strong>List-Unsubscribe RFC 8058</strong> giúp tăng uy tín với Google & Yahoo Mail.</p>
    `,
  },
  {
    id: 'tpl-3',
    name: 'Black Friday VIP Exclusive 30% Off',
    subject: 'Ưu đãi độc quyền giảm 30% cho khách hàng thân thiết',
    previewText: 'Cơ hội nâng cấp gói Enterprise với chi phí tối ưu nhất trong năm.',
    category: 'Promotional',
    status: 'draft',
    createdBy: 'Lê Hoàng Content',
    createdAt: '18/08/2026',
    updatedAt: '25/08/2026',
    thumbnailGradient: 'bg-gradient-to-tr from-amber-600 to-rose-600',
    htmlContent: `
      <p>Kính gửi <strong>{{firstName}} {{lastName}}</strong>,</p>
      <p>Dành riêng cho <em>{{company}}</em>: Mã ưu đãi <strong>VIP30</strong> giảm ngay 30% cho chu kỳ đăng ký năm tiếp theo.</p>
    `,
  },
  {
    id: 'tpl-4',
    name: 'Welcome & 14-Day Onboarding Sequence',
    subject: 'Chào mừng bạn đến với MailFlow — Bắt đầu 3 bước thiết lập đầu tiên',
    previewText: 'Hướng dẫn xác thực tên miền DNS và nạp danh bạ liên hệ trong 5 phút.',
    category: 'Onboarding',
    status: 'published',
    createdBy: 'Nguyễn Văn Editor',
    createdAt: '01/08/2026',
    updatedAt: '20/08/2026',
    thumbnailGradient: 'bg-gradient-to-tr from-violet-600 to-purple-600',
    htmlContent: `
      <p>Chào mừng <strong>{{firstName}}</strong> gia nhập cộng đồng hơn 14,000 doanh nghiệp tin dùng MailFlow!</p>
      <p>Để bắt đầu gửi chiến dịch email đầu tiên, bạn chỉ cần thực hiện 3 bước cấu hình đơn giản.</p>
    `,
  },
]

export interface TemplatesPageProps {
  onNavigate: (path: string) => void
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  const filteredTemplates = templates.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = t.name.toLowerCase().includes(q)
      const matchSub = t.subject.toLowerCase().includes(q)
      if (!matchName && !matchSub) return false
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    return true
  })

  const handleDuplicate = (tpl: EmailTemplate) => {
    const duplicated: EmailTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Bản sao)`,
      status: 'draft',
      createdAt: 'Hôm nay',
      updatedAt: 'Hôm nay',
    }
    setTemplates((prev) => [duplicated, ...prev])
    showToast({
      type: 'success',
      title: 'Đã nhân bản mẫu email',
      description: `Đã tạo bản sao "${duplicated.name}".`,
    })
  }

  const handleDelete = (id: string, name: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    showToast({
      type: 'warning',
      title: 'Đã xóa mẫu email',
      description: `Đã xóa mẫu "${name}".`,
    })
  }

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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus-ring cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã phát hành (Published)</option>
            <option value="draft">Bản nháp (Draft)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus-ring cursor-pointer"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="Product">Product Launch</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Promotional">Promotional</option>
            <option value="Onboarding">Onboarding</option>
          </select>

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
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
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
              <CardFooter className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setPreviewTemplate(template)}
                >
                  Xem Trước
                </Button>

                <div className="flex items-center gap-1">
                  {/* Edit - only if user has TEMPLATE_UPDATE */}
                  <PermissionGate permission={PERMISSIONS.TEMPLATE_UPDATE}>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
                      onClick={() => onNavigate(`/templates/${template.id}/edit`)}
                    >
                      Sửa
                    </Button>
                  </PermissionGate>

                  {/* More Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                        <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                        <span>Xem trước giao diện</span>
                      </DropdownMenuItem>

                      <PermissionGate permission={PERMISSIONS.TEMPLATE_CREATE}>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                          <span>Nhân bản mẫu</span>
                        </DropdownMenuItem>
                      </PermissionGate>

                      <PermissionGate permission={PERMISSIONS.TEMPLATE_DELETE}>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id, template.name)}
                          className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          <span>Xóa mẫu email</span>
                        </DropdownMenuItem>
                      </PermissionGate>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 4. TEMPLATES TABLE VIEW */}
      {viewMode === 'table' && (
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
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTemplates.map((template) => (
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(template)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission(PERMISSIONS.TEMPLATE_UPDATE) && (
                          <button
                            type="button"
                            onClick={() => onNavigate(`/templates/${template.id}/edit`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  )
}

export default TemplatesPage
