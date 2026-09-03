import React, { useState, useRef } from 'react'
import {
  Code,
  Search,
  Eye,
  Check,
  Save,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { SimpleSelect, type SelectOption } from '../../ui/Select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import { VariablePicker } from '../../templates/VariablePicker'
import { TemplatePreviewDialog } from '../../templates/TemplatePreviewDialog'
import { useToast } from '../../ui/Toast'
import type { CampaignStep3Content } from '../../../types/campaignWizard.types'
import type { EmailTemplate } from '../../../types/template.types'

const TEMPLATE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả phân loại' },
  { value: 'Product', label: 'Product Launch' },
  { value: 'Newsletter', label: 'Newsletter' },
  { value: 'Promotional', label: 'Promotional' },
  { value: 'Onboarding', label: 'Onboarding' },
]

const AVAILABLE_TEMPLATES: EmailTemplate[] = [
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
      <p>Chúc bạn và doanh nghiệp <em>{{company}}</em> có tuần làm việc hiệu quả!</p>
    `,
  },
  {
    id: 'tpl-3',
    name: 'Black Friday VIP Exclusive 30% Off',
    subject: 'Ưu đãi độc quyền giảm 30% cho khách hàng thân thiết',
    previewText: 'Cơ hội nâng cấp gói Enterprise với chi phí tối ưu nhất trong năm.',
    category: 'Promotional',
    status: 'published',
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

  const filteredTemplates = AVAILABLE_TEMPLATES.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!t.name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) {
        return false
      }
    }
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    return true
  })

  // Select Template and import HTML into Campaign Content
  const handleSelectTemplate = (template: EmailTemplate) => {
    onChange({
      templateId: template.id,
      templateName: template.name,
      htmlContent: template.htmlContent.trim(),
    })
    setContentMode('custom')
    showToast({
      type: 'success',
      title: 'Đã nạp mẫu email',
      description: `Đã áp dụng mẫu "${template.name}". Bạn có thể chỉnh sửa nội dung riêng cho chiến dịch này.`,
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
        <Card className="animate-in fade-in-0">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Chọn Mẫu Email Từ Thư Viện</CardTitle>
              <CardDescription className="text-xs">
                Nội dung từ mẫu được chọn sẽ được nạp vào chiến dịch này. Bạn hoàn toàn có thể tùy biến văn bản mà không ảnh hưởng tới mẫu gốc.
              </CardDescription>
            </div>

            {/* Filter */}
            <div className="w-48">
              <SimpleSelect
                size="sm"
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                options={TEMPLATE_FILTER_OPTIONS}
                className="rounded-xl font-semibold"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <Input
              placeholder="Tìm kiếm mẫu email theo tên hoặc chủ đề..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Templates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => {
                const isCurrentActive = data.templateId === tpl.id

                return (
                  <div
                    key={tpl.id}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                      isCurrentActive
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Simulated Banner */}
                    <div
                      className={`h-28 p-3 text-white flex flex-col justify-between ${
                        tpl.thumbnailGradient || 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase">
                          {tpl.category}
                        </span>
                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Đang Chọn</span>
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-xs line-clamp-1">{tpl.name}</div>
                    </div>

                    {/* Content preview */}
                    <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between text-xs">
                      <div className="text-slate-500 line-clamp-2 text-[11px]">
                        {tpl.previewText}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setPreviewTemplate(tpl)}
                        >
                          Xem Trước
                        </Button>

                        <Button
                          type="button"
                          variant={isCurrentActive ? 'secondary' : 'primary'}
                          size="sm"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          onClick={() => handleSelectTemplate(tpl)}
                        >
                          {isCurrentActive ? 'Tiếp Tục Soạn' : 'Áp Dụng Mẫu Này'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
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
