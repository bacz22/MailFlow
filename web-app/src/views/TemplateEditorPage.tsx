import React, { useEffect, useRef, useState } from 'react'
import {
  Code,
  AlertTriangle,
} from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { SimpleSelect, type SelectOption } from '../components/ui/Select'
import { FormField, FormLabel } from '../components/ui/FormGroup'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ConfirmDialog,
} from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { VariablePicker } from '../components/templates/VariablePicker'
import { TemplateToolbar } from '../components/templates/TemplateToolbar'
import { TemplatePreview } from '../components/templates/TemplatePreview'
import { SendTestDialog } from '../components/templates/SendTestDialog'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { templateService } from '../services/template.service'
import type { EmailTemplate } from '../types/template.types'
import {
  DEFAULT_BANNER_LABEL,
  DEFAULT_THUMBNAIL_GRADIENT,
  TEMPLATE_THUMBNAIL_GRADIENTS,
} from '../components/templates/thumbnailGradients'

const DEFAULT_SAMPLE_CONTENT = `<p>Xin chào <strong>{{firstName}}</strong>,</p>
<p>Cảm ơn bạn đã đồng hành cùng MailFlow trong việc tối ưu hóa chiến dịch email marketing của doanh nghiệp <em>{{company}}</em>.</p>
<p>Dưới đây là một số cập nhật tính năng mới nhất tuần này giúp tăng tỷ lệ mở thư và chuyển đổi khách hàng.</p>`

const TEMPLATE_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Newsletter', label: 'Newsletter' },
  { value: 'Product', label: 'Product Launch' },
  { value: 'Promotional', label: 'Promotional' },
  { value: 'Onboarding', label: 'Onboarding' },
  { value: 'Transactional', label: 'Transactional' },
]

export interface TemplateEditorPageProps {
  templateId?: string
  initialData?: Partial<EmailTemplate>
  isEdit?: boolean
  onNavigate: (path: string) => void
}

export const TemplateEditorPage: React.FC<TemplateEditorPageProps> = ({
  templateId,
  initialData,
  isEdit = false,
  onNavigate,
}) => {
  const { showToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [savedId, setSavedId] = useState<string | undefined>(templateId)
  const [isLoading, setIsLoading] = useState(!!isEdit && !!templateId)
  const [name, setName] = useState(
    initialData?.name || (isEdit ? '' : 'Mẫu Email Chiến Dịch Mới')
  )
  const [subject, setSubject] = useState(
    initialData?.subject || ''
  )
  const [category, setCategory] = useState<EmailTemplate['category']>(
    initialData?.category || 'Newsletter'
  )
  const [content, setContent] = useState(
    initialData?.htmlContent || DEFAULT_SAMPLE_CONTENT
  )
  const [thumbnailGradient, setThumbnailGradient] = useState(
    initialData?.thumbnailGradient || DEFAULT_THUMBNAIL_GRADIENT
  )
  const [bannerLabel, setBannerLabel] = useState(
    initialData?.bannerLabel || DEFAULT_BANNER_LABEL
  )
  const [bannerTitle, setBannerTitle] = useState(
    initialData?.bannerTitle || initialData?.subject || (isEdit ? '' : '')
  )

  // UI states
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendTestOpen, setIsSendTestOpen] = useState(false)
  const [isExitWarningOpen, setIsExitWarningOpen] = useState(false)
  const [confirmSaveAction, setConfirmSaveAction] = useState<{ isDraft: boolean } | null>(null)

  useEffect(() => {
    if (!isEdit || !templateId) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const data = await templateService.get(templateId)
        if (cancelled) return
        setSavedId(data.id)
        setName(data.name)
        setSubject(data.subject)
        setCategory(data.category)
        setContent(data.htmlContent)
        setThumbnailGradient(data.thumbnailGradient || DEFAULT_THUMBNAIL_GRADIENT)
        setBannerLabel(data.bannerLabel || DEFAULT_BANNER_LABEL)
        setBannerTitle(data.bannerTitle || data.subject)
        setIsDirty(false)
      } catch (error) {
        if (cancelled) return
        showToast({
          type: 'error',
          title: 'Không tải được mẫu email',
          description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
        })
        onNavigate('/templates')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, templateId, onNavigate, showToast])

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

  const handleInitiateSave = (isDraft = false) => {
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

    setConfirmSaveAction({ isDraft })
  }

  const executeSave = async (isDraft = false) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        category,
        status: (isDraft ? 'draft' : 'published') as EmailTemplate['status'],
        htmlContent: content,
        thumbnailGradient,
        bannerLabel: bannerLabel.trim(),
        bannerTitle: bannerTitle.trim(),
      }
      if (savedId) {
        await templateService.update(savedId, payload)
      } else {
        const created = await templateService.create(payload)
        setSavedId(created.id)
      }
      setIsDirty(false)
      showToast({
        type: 'success',
        title: isDraft ? 'Đã lưu bản nháp' : isEdit ? 'Đã cập nhật mẫu' : 'Đã tạo mẫu mới',
        description: `Mẫu email "${name}" đã được lưu thành công vào thư viện.`,
      })
      setConfirmSaveAction(null)
      onNavigate('/templates')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không lưu được mẫu',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAttemptBack = () => {
    if (isDirty) {
      setIsExitWarningOpen(true)
    } else {
      onNavigate('/templates')
    }
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500 py-10 text-center">Đang tải mẫu email...</div>
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
        onSaveDraft={() => handleInitiateSave(true)}
        onSaveTemplate={() => handleInitiateSave(false)}
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
                    <SimpleSelect
                      value={category}
                      onValueChange={(val) => {
                        setCategory(val as EmailTemplate['category'])
                        setIsDirty(true)
                      }}
                      options={TEMPLATE_CATEGORY_OPTIONS}
                    />
                  </FormField>
                </div>
              </div>

              {/* Subject */}
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
                <FormLabel>Nhãn banner</FormLabel>
                <Input
                  placeholder="Ví dụ: MailFlow Communication"
                  value={bannerLabel}
                  maxLength={80}
                  onChange={(e) => {
                    setBannerLabel(e.target.value)
                    setIsDirty(true)
                  }}
                />
              </FormField>

              <FormField>
                <FormLabel>Tiêu đề banner</FormLabel>
                <Input
                  placeholder="Chữ lớn trên banner màu — độc lập với tiêu đề hộp thư"
                  value={bannerTitle}
                  maxLength={200}
                  onChange={(e) => {
                    setBannerTitle(e.target.value)
                    setIsDirty(true)
                  }}
                />
              </FormField>

              <FormField>
                <FormLabel>Màu banner (thumbnail)</FormLabel>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Màu banner mẫu email">
                  {TEMPLATE_THUMBNAIL_GRADIENTS.map((option) => {
                    const selected = thumbnailGradient === option.className
                    return (
                      <button
                        key={option.className}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        title={option.label}
                        onClick={() => {
                          setThumbnailGradient(option.className)
                          setIsDirty(true)
                        }}
                        className={`h-11 w-11 rounded-xl border-2 shadow-inner focus-ring ${option.className} ${
                          selected
                            ? 'border-white ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                            : 'border-white/40 hover:scale-105'
                        }`}
                      />
                    )
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Lưu vào thumbnail_gradient — dùng cho thẻ thư viện và banner mô phỏng, không nằm trong HTML gửi đi.
                </p>
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
                <Textarea
                  ref={textareaRef}
                  rows={14}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setIsDirty(true)
                  }}
                  placeholder="Nhập nội dung HTML hoặc văn bản với các thẻ <p>, <strong>, <a>..."
                  className="font-mono text-xs p-3.5 leading-relaxed"
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
            htmlContent={content}
            device={device}
            thumbnailGradient={thumbnailGradient}
            bannerLabel={bannerLabel}
            bannerTitle={bannerTitle}
          />
        </div>
      </div>

      {/* 3. SEND TEST DIALOG */}
      <SendTestDialog
        isOpen={isSendTestOpen}
        onClose={() => setIsSendTestOpen(false)}
        templateId={savedId}
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
                void executeSave(false)
              }}
            >
              Lưu Mẫu Ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Confirmation Dialog */}
      <ConfirmDialog
        open={confirmSaveAction !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setConfirmSaveAction(null)
        }}
        title={
          confirmSaveAction?.isDraft
            ? 'Xác nhận lưu bản nháp?'
            : isEdit
            ? 'Xác nhận cập nhật mẫu email?'
            : 'Xác nhận lưu mẫu email mới?'
        }
        description={
          confirmSaveAction?.isDraft
            ? `Mẫu email "${name}" sẽ được lưu vào hệ thống ở trạng thái bản nháp (Draft). Bạn có thể tiếp tục chỉnh sửa bất cứ lúc nào.`
            : `Mẫu email "${name}" sẽ được lưu và sẵn sàng để áp dụng vào các chiến dịch gửi thư. Bạn có muốn tiếp tục?`
        }
        confirmText={
          confirmSaveAction?.isDraft
            ? 'Lưu bản nháp'
            : isEdit
            ? 'Cập nhật mẫu'
            : 'Lưu mẫu email'
        }
        cancelText="Hủy"
        variant="primary"
        isLoading={isSubmitting}
        onConfirm={() => {
          if (confirmSaveAction) {
            void executeSave(confirmSaveAction.isDraft)
          }
        }}
      />
    </div>
  )
}

export default TemplateEditorPage
