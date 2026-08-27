import React, { useState, useRef } from 'react'
import {
  Code,
  AlertTriangle,
} from 'lucide-react'
import { Input } from '../components/ui/Input'
import { FormField, FormLabel } from '../components/ui/FormGroup'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { VariablePicker } from '../components/templates/VariablePicker'
import { TemplateToolbar } from '../components/templates/TemplateToolbar'
import { TemplatePreview } from '../components/templates/TemplatePreview'
import { SendTestDialog } from '../components/templates/SendTestDialog'
import { useToast } from '../components/ui/Toast'
import type { EmailTemplate } from '../types/template.types'

const DEFAULT_SAMPLE_CONTENT = `<p>Xin chào <strong>{{firstName}}</strong>,</p>
<p>Cảm ơn bạn đã đồng hành cùng MailFlow trong việc tối ưu hóa chiến dịch email marketing của doanh nghiệp <em>{{company}}</em>.</p>
<p>Dưới đây là một số cập nhật tính năng mới nhất tuần này giúp tăng tỷ lệ mở thư và chuyển đổi khách hàng.</p>`

export interface TemplateEditorPageProps {
  templateId?: string
  initialData?: Partial<EmailTemplate>
  isEdit?: boolean
  onNavigate: (path: string) => void
}

export const TemplateEditorPage: React.FC<TemplateEditorPageProps> = ({
  templateId: _templateId,
  initialData,
  isEdit = false,
  onNavigate,
}) => {
  const { showToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form states
  const [name, setName] = useState(
    initialData?.name || (isEdit ? 'Product Launch 2.0' : 'Mẫu Email Chiến Dịch Mới')
  )
  const [subject, setSubject] = useState(
    initialData?.subject || (isEdit ? '🚀 Ra mắt MailFlow 2.0: Trải nghiệm email marketing đỉnh cao' : 'Khám phá giải pháp tối ưu email từ MailFlow')
  )
  const [previewText, setPreviewText] = useState(
    initialData?.previewText || 'Tăng 300% hiệu suất gửi thư với hạ tầng Dedicated IP.'
  )
  const [category, setCategory] = useState<EmailTemplate['category']>(
    initialData?.category || 'Newsletter'
  )
  const [content, setContent] = useState(
    initialData?.htmlContent || DEFAULT_SAMPLE_CONTENT
  )

  // UI states
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendTestOpen, setIsSendTestOpen] = useState(false)
  const [isExitWarningOpen, setIsExitWarningOpen] = useState(false)

  // Insert Variable at cursor position
  const handleInsertVariable = (variableKey: string) => {
    setIsDirty(true)
    const textarea = textareaRef.current
    if (!textarea) {
      setContent((prev) => prev + ' ' + variableKey)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = content
    const updated = currentText.substring(0, start) + variableKey + currentText.substring(end)

    setContent(updated)

    // Restore focus and cursor
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

  const handleSave = async (isDraft = false) => {
    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập tên mẫu',
        description: 'Vui lòng cung cấp tên gợi nhớ cho mẫu email.',
      })
      return
    }
    if (!subject.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập tiêu đề thư',
        description: 'Vui lòng nhập dòng tiêu đề email (Subject Line).',
      })
      return
    }
    if (!content.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa có nội dung',
        description: 'Nội dung email không được để trống.',
      })
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)
    setIsDirty(false)

    showToast({
      type: 'success',
      title: isDraft ? 'Đã lưu bản nháp' : isEdit ? 'Đã cập nhật mẫu' : 'Đã tạo mẫu mới',
      description: `Mẫu email "${name}" đã được lưu thành công vào thư viện.`,
    })

    onNavigate('/templates')
  }

  const handleAttemptBack = () => {
    if (isDirty) {
      setIsExitWarningOpen(true)
    } else {
      onNavigate('/templates')
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP STICKY TOOLBAR */}
      <TemplateToolbar
        device={device}
        onChangeDevice={setDevice}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onBack={handleAttemptBack}
        onOpenSendTest={() => setIsSendTestOpen(true)}
        onSaveDraft={() => handleSave(true)}
        onSaveTemplate={() => handleSave(false)}
      />

      {/* 2. DUAL-PANE WORKSPACE: LEFT EDITOR + RIGHT PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: FORM & RICH CONTENT EDITOR (7 COLS) */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-5">
          {/* Metadata Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base">Thông Tin Mẫu Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <FormField>
                    <FormLabel required>Tên Mẫu (Template Name)</FormLabel>
                    <Input
                      placeholder="Ví dụ: Product Launch 2.0..."
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setIsDirty(true)
                      }}
                    />
                  </FormField>
                </div>

                <div>
                  <FormField>
                    <FormLabel>Phân Loại</FormLabel>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value as any)
                        setIsDirty(true)
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus-ring cursor-pointer"
                    >
                      <option value="Newsletter">Newsletter</option>
                      <option value="Product">Product Launch</option>
                      <option value="Promotional">Promotional</option>
                      <option value="Onboarding">Onboarding</option>
                      <option value="Transactional">Transactional</option>
                    </select>
                  </FormField>
                </div>
              </div>

              {/* Subject & Preview Text */}
              <FormField>
                <FormLabel required>Tiêu Đề Email (Subject Line)</FormLabel>
                <Input
                  placeholder="Nhập dòng tiêu đề hiển thị trong hộp thư đến..."
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value)
                    setIsDirty(true)
                  }}
                />
              </FormField>

              <FormField>
                <FormLabel>Đoạn Văn Xem Trước (Preview Text / Preheader)</FormLabel>
                <Input
                  placeholder="Đoạn văn ngắn xuất hiện cạnh tiêu đề trên Gmail/Apple Mail..."
                  value={previewText}
                  onChange={(e) => {
                    setPreviewText(e.target.value)
                    setIsDirty(true)
                  }}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Email Content HTML / Rich Text Editor Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base">Nội Dung Thư (HTML / Rich Text)</CardTitle>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {content.length} ký tự
              </span>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Dynamic Variable Picker Component */}
              <VariablePicker onSelectVariable={handleInsertVariable} />

              {/* Textarea Editor */}
              <div className="space-y-1">
                <textarea
                  ref={textareaRef}
                  rows={14}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setIsDirty(true)
                  }}
                  placeholder="Nhập nội dung HTML hoặc văn bản với các thẻ <p>, <strong>, <a>..."
                  className="w-full font-mono text-xs p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed text-slate-900 dark:text-slate-100 focus-ring"
                />
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Hỗ trợ thẻ HTML chuẩn email: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;h2&gt;</span>
                  <span>Tự động responsive</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE EMAIL SIMULATION PREVIEW (6 COLS) */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Khung Mô Phỏng Hiển Thị Email Thực Tế
            </h2>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">
              Live Preview
            </span>
          </div>

          <TemplatePreview
            subject={subject}
            previewText={previewText}
            htmlContent={content}
            device={device}
          />
        </div>
      </div>

      {/* 3. SEND TEST DIALOG */}
      <SendTestDialog
        isOpen={isSendTestOpen}
        onClose={() => setIsSendTestOpen(false)}
        templateName={name}
        subject={subject}
      />

      {/* 4. UNSAVED CHANGES EXIT WARNING DIALOG */}
      <Dialog open={isExitWarningOpen} onOpenChange={() => setIsExitWarningOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Thay Đổi Chưa Được Lưu</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Bạn có các chỉnh sửa trong mẫu email chưa được lưu lại. Nếu rời khỏi đây, các thay đổi chưa lưu sẽ bị mất.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsExitWarningOpen(false)
                onNavigate('/templates')
              }}
            >
              Rời Đi (Không Lưu)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsExitWarningOpen(false)
                handleSave(false)
              }}
            >
              Lưu Mẫu Ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TemplateEditorPage
