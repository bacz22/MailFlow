import React, { useState } from 'react'
import {
  Smartphone,
  Monitor,
  Mail,
  Send,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { TemplatePreview } from './TemplatePreview'
import type { EmailTemplate } from '../../types/template.types'

export interface TemplatePreviewDialogProps {
  template: EmailTemplate | null
  isOpen: boolean
  onClose: () => void
  onUseTemplate?: (template: EmailTemplate) => void
}

export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  if (!template) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="relative p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-10"
            title="Đóng xem trước"
            aria-label="Đóng xem trước"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8 sm:pr-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <DialogTitle className="text-base sm:text-lg font-bold">{template.name}</DialogTitle>
                <Badge variant="default" className="text-[10px]">
                  {template.category}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 line-clamp-1">
                Tiêu đề: <strong className="text-slate-800 dark:text-slate-200">{template.subject}</strong>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 font-semibold ${
                    device === 'desktop'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Mô phỏng máy tính"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 font-semibold ${
                    device === 'mobile'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Mô phỏng di động"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              {onUseTemplate && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onClose()
                    onUseTemplate(template)
                  }}
                >
                  Dùng Mẫu Này
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[420px] [&_>div]:rounded-none [&_>div]:border-0 [&_>div]:min-h-[420px]">
          <TemplatePreview
            subject={template.subject}
            htmlContent={template.htmlContent}
            device={device}
            thumbnailGradient={template.thumbnailGradient}
            bannerLabel={template.bannerLabel}
            bannerTitle={template.bannerTitle?.trim() || template.name}
            fromName="MailFlow Enterprise"
            fromEmail="newsletter@mailflow.vn"
            resolveVariables={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TemplatePreviewDialog
