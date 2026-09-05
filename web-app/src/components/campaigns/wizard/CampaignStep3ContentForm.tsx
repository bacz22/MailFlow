import React, { useState, useRef, useEffect } from 'react'
import {
  Code,
  Search,
  Eye,
  Check,
  Save,
  FileText,
  Layers,
  ArrowRight,
  LayoutGrid,
  List,
  X,
  RotateCcw,
} from 'lucide-react'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { SimpleSelect, type SelectOption } from '../../ui/Select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import { Pagination } from '../../ui/Pagination'
import { VariablePicker } from '../../templates/VariablePicker'
import { TemplatePreviewDialog } from '../../templates/TemplatePreviewDialog'
import { useToast } from '../../ui/Toast'
import { templateService } from '../../../services/template.service'
import type { CampaignStep3Content } from '../../../types/campaignWizard.types'
import type { EmailTemplate } from '../../../types/template.types'

const TEMPLATE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả phân loại' },
  { value: 'Transactional', label: 'Transactional' },
  { value: 'Onboarding', label: 'Onboarding' },
  { value: 'Promotional', label: 'Promotional' },
  { value: 'Product', label: 'Product Launch' },
  { value: 'Newsletter', label: 'Newsletter' },
]

export interface CampaignStep3ContentFormProps {
  data: CampaignStep3Content
  campaignSubject: string
  campaignPreviewText?: string
  onChange: (data: Partial<CampaignStep3Content>) => void
}

export const CampaignStep3ContentForm: React.FC<CampaignStep3ContentFormProps> = ({
  data,
  campaignSubject,
  campaignPreviewText,
  onChange,
}) => {
  const { showToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Mode: 'template' (browser) vs 'custom' (editor)
  const [contentMode, setContentMode] = useState<'template' | 'custom'>(
    data.templateId ? 'custom' : 'template'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const rows = await templateService.list({ status: 'published' })
        if (!cancelled) setTemplates(rows)
      } catch {
        if (!cancelled) setTemplates([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredTemplates = templates.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = t.name.toLowerCase().includes(q)
      const matchSubject = t.subject?.toLowerCase().includes(q)
      const matchPreview = t.previewText?.toLowerCase().includes(q)
      if (!matchName && !matchSubject && !matchPreview) {
        return false
      }
    }
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    return true
  })

  const totalItems = filteredTemplates.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedTemplates = filteredTemplates.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setCurrentPage(1)
  }

  // Select Template and import HTML into Campaign Content
  const handleSelectTemplate = (template: EmailTemplate) => {
    onChange({
      templateId: template.id,
      templateName: template.name,
      htmlContent: template.htmlContent.trim(),
      thumbnailGradient: template.thumbnailGradient,
      bannerLabel: template.bannerLabel,
      bannerTitle: template.bannerTitle,
    })
    // Do not overwrite step1 subject/previewText — user owns those fields on step 1.
    setContentMode('custom')
    showToast({
      type: 'success',
      title: 'Đã nạp mẫu email',
      description: `Đã áp dụng nội dung mẫu "${template.name}". Tiêu đề / preheader giữ nguyên ở bước 1.`,
    })
  }

  // Insert Variable at cursor position
  const handleInsertVariable = (variableKey: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange({ htmlContent: (data.htmlContent || '') + ' ' + variableKey })
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = data.htmlContent || ''
    const updated = current.substring(0, start) + variableKey + current.substring(end)

    onChange({ htmlContent: updated })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variableKey.length, start + variableKey.length)
    }, 50)

    showToast({
      type: 'info',
      title: 'Đã chèn biến',
      description: `Đã chèn ${variableKey} vào vị trí con trỏ.`,
    })
  }

  // Save current customized HTML as a new library template
  const handleSaveAsNewTemplate = () => {
    showToast({
      type: 'success',
      title: 'Đã lưu thành Mẫu Mới',
      description: 'Nội dung này đã được sao lưu vào Thư Viện Mẫu Email để tái sử dụng trong tương lai.',
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Top Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-600" />
            <span>Phương Thức Thiết Kế Nội Dung:</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Chọn mẫu sẵn có từ thư viện hoặc tự do soạn thảo mã HTML tùy biến.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setContentMode('template')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              contentMode === 'template'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Thư Viện Mẫu Có Sẵn</span>
          </button>
          <button
            type="button"
            onClick={() => setContentMode('custom')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              contentMode === 'custom'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Soạn Thảo Chiến Dịch</span>
          </button>
        </div>
      </div>

      {/* ================= PATHWAY A: EXISTING TEMPLATE BROWSER ================= */}
      {contentMode === 'template' && (
        <div className="space-y-4 animate-in fade-in-0">
          {/* Currently Selected Template Banner (if any) */}
          {data.templateId && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Mẫu Đang Áp Dụng: <span className="text-blue-600 dark:text-blue-400 font-semibold">{data.templateName || 'Đã chọn'}</span>
                    </span>
                    <Badge variant="success" size="sm" className="font-medium">
                      Đã nạp vào chiến dịch
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nội dung mẫu này đang được dùng trong chiến dịch. Bạn có thể chọn mẫu khác bên dưới hoặc tiếp tục tùy biến.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="text-xs shrink-0 self-end sm:self-auto"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setContentMode('custom')}
              >
                Vào Soạn Thảo Nội Dung
              </Button>
            </div>
          )}

          <Card className="shadow-xs border-slate-200/90 dark:border-slate-800/90">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Chọn Mẫu Email Từ Thư Viện</CardTitle>
                  <Badge variant="secondary" size="sm" className="font-mono font-bold">
                    {totalItems.toLocaleString()} mẫu
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Nội dung từ mẫu được chọn sẽ được nạp vào chiến dịch này. Bạn hoàn toàn có thể tùy biến văn bản mà không ảnh hưởng tới mẫu gốc.
                </CardDescription>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Dạng lưới thẻ (Grid)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Dạng danh sách gọn (Compact List)"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Toolbar: Search + Category Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Tìm kiếm mẫu email theo tên hoặc chủ đề..."
                    leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                    rightIcon={
                      searchQuery ? (
                        <button
                          type="button"
                          onClick={() => handleSearchChange('')}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          title="Xóa tìm kiếm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : null
                    }
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-56">
                  <SimpleSelect
                    size="md"
                    value={categoryFilter}
                    onValueChange={handleCategoryChange}
                    options={TEMPLATE_FILTER_OPTIONS}
                    className="rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Templates Container */}
              {totalItems === 0 ? (
                /* Empty state */
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Không tìm thấy mẫu email phù hợp
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {searchQuery
                        ? `Không có mẫu nào khớp với "${searchQuery}".`
                        : 'Không có mẫu nào trong phân loại đã chọn.'}
                    </p>
                  </div>
                  {(searchQuery || categoryFilter !== 'all') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={handleClearFilters}
                    >
                      Xóa Bộ Lọc
                    </Button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedTemplates.map((tpl) => {
                    const isCurrentActive = data.templateId === tpl.id

                    return (
                      <div
                        key={tpl.id}
                        className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                          isCurrentActive
                            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {/* Simulated Banner */}
                        <div
                          className={`h-28 p-3 text-white flex flex-col justify-between ${
                            tpl.thumbnailGradient || 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                              {tpl.category}
                            </span>
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3" />
                                <span>Đang Chọn</span>
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-xs line-clamp-1 drop-shadow-xs">{tpl.name}</div>
                        </div>

                        {/* Content preview */}
                        <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between text-xs">
                          <div className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[11px] h-8 leading-relaxed">
                            {tpl.previewText || tpl.subject || 'Không có mô tả xem trước'}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-slate-600 dark:text-slate-300"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => setPreviewTemplate(tpl)}
                            >
                              Xem Trước
                            </Button>

                            <Button
                              type="button"
                              variant={isCurrentActive ? 'secondary' : 'primary'}
                              size="sm"
                              className="text-xs"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                              onClick={() => handleSelectTemplate(tpl)}
                            >
                              {isCurrentActive ? 'Tiếp Tục Soạn' : 'Áp Dụng Mẫu'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Compact List View */
                <div className="space-y-2">
                  {paginatedTemplates.map((tpl) => {
                    const isCurrentActive = data.templateId === tpl.id

                    return (
                      <div
                        key={tpl.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrentActive
                            ? 'border-blue-600 bg-blue-50/25 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-11 h-11 rounded-xl text-white shrink-0 flex items-center justify-center font-bold text-xs shadow-xs ${
                              tpl.thumbnailGradient || 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}
                          >
                            <Layers className="w-5 h-5 opacity-90" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                                {tpl.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold uppercase">
                                {tpl.category}
                              </span>
                              {isCurrentActive && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                  <Check className="w-3 h-3" />
                                  <span>Đang Chọn</span>
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                              {tpl.previewText || tpl.subject || 'Không có mô tả xem trước'}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-600 dark:text-slate-300"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setPreviewTemplate(tpl)}
                          >
                            Xem Trước
                          </Button>

                          <Button
                            type="button"
                            variant={isCurrentActive ? 'secondary' : 'primary'}
                            size="sm"
                            className="text-xs"
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            onClick={() => handleSelectTemplate(tpl)}
                          >
                            {isCurrentActive ? 'Tiếp Tục Soạn' : 'Áp Dụng Mẫu'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    pageSizeOptions={[6, 12, 24, 48]}
                    itemLabel="mẫu email"
                    onPageChange={(page) => setCurrentPage(page)}
                    onPageSizeChange={(size) => {
                      setPageSize(size)
                      setCurrentPage(1)
                    }}
                    className="px-0 py-2 border-t border-slate-100 dark:border-slate-800"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= PATHWAY B: CAMPAIGN CONTENT EDITOR ================= */}
      {contentMode === 'custom' && (
        <div className="space-y-4 animate-in fade-in-0">
          {/* Decoupling notice & current subject context */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-900 dark:text-blue-200">
                  Nội Dung Riêng Biệt Cho Chiến Dịch:
                </span>
                {data.templateName && (
                  <Badge variant="default" className="text-[10px]">
                    Kế thừa từ: {data.templateName}
                  </Badge>
                )}
              </div>
              <p className="text-blue-700/80 dark:text-blue-300 text-[11px]">
                Tiêu đề: <strong>"{campaignSubject}"</strong>
                {campaignPreviewText && <span> • Preheader: <em>"{campaignPreviewText}"</em></span>}
                {' '}• Mọi thay đổi tại đây không ảnh hưởng đến Mẫu gốc trong thư viện.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs shrink-0 bg-white dark:bg-slate-900"
              leftIcon={<Save className="w-3.5 h-3.5 text-blue-600" />}
              onClick={handleSaveAsNewTemplate}
            >
              Lưu Thành Mẫu Mới
            </Button>
          </div>

          {/* HTML / Rich Text Editor Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base">Soạn Thảo Nội Dung Thư</CardTitle>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {(data.htmlContent || '').length} ký tự HTML
              </span>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Dynamic Variable Picker Component */}
              <VariablePicker onSelectVariable={handleInsertVariable} />

              {/* Textarea Editor */}
              <div className="space-y-1.5">
                <Textarea
                  ref={textareaRef}
                  rows={14}
                  value={data.htmlContent || ''}
                  onChange={(e) => onChange({ htmlContent: e.target.value })}
                  placeholder="Nhập mã HTML hoặc văn bản email..."
                  className="font-mono text-xs p-3.5 leading-relaxed"
                />
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Hỗ trợ thẻ chuẩn email: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;h2&gt;</span>
                  <span className="text-emerald-600 font-medium">Tự động gắn mã bảo vệ RFC 8058 khi phát hành</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Dialog Modal */}
      <TemplatePreviewDialog
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={(t) => {
          handleSelectTemplate(t)
          setPreviewTemplate(null)
        }}
      />
    </div>
  )
}

export default CampaignStep3ContentForm
