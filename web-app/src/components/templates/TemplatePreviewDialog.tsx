import React, { useState } from 'react'
import {
  Smartphone,
  Monitor,
  Mail,
  Send,
  ShieldCheck,
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
        {/* Header Bar */}
        <div className="relative p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          {/* Nút X nằm ở góc trên cao độc lập, không cùng hàng với các nút bên dưới */}
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

            {/* Device toggle & CTA (nằm thấp hơn bên dưới, không cùng hàng nút X) */}
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

        {/* Email Canvas Simulation Box */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto flex items-center justify-center min-h-[420px]">
          <div
            className={`transition-all duration-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden ${
              device === 'mobile' ? 'w-[360px] min-h-[580px]' : 'w-full max-w-2xl min-h-[500px]'
            }`}
          >
            {/* Email Client Simulated Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-1.5 text-xs select-none">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">MailFlow Enterprise</span>
                  <span>&lt;newsletter@mailflow.vn&gt;</span>
                </div>
                <span>Hôm nay, 10:00</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                {template.subject}
              </div>
              {template.previewText && (
                <div className="text-[11px] text-slate-500 truncate">
                  {template.previewText}
                </div>
              )}
            </div>

            {/* Email Rendered Body */}
            <div className="p-6 space-y-6">
              {/* Header Banner */}
              <div
                className={`p-6 rounded-xl text-white space-y-2 text-center ${
                  template.thumbnailGradient || 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
              >
                {template.bannerLabel?.trim() ? (
                  <div className="text-xs font-bold uppercase tracking-wider text-white/80">
                    {template.bannerLabel}
                  </div>
                ) : null}
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {template.bannerTitle?.trim() || template.name}
                </h2>
              </div>

              {/* Body Content */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: template.htmlContent }}
              />

              {/* Call to Action Button */}
              {/* <div className="pt-2 text-center">
                <span className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30">
                  Khám Phá Ngay
                </span>
              </div> */}

              {/* RFC 8058 1-Click Unsubscribe Footer */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center space-y-1.5 text-[10px] text-slate-400">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                  {/* <span>Tuân thủ bảo mật DKIM/SPF & RFC 8058 1-Click Unsubscribe</span> */}
                </div>
                <p>© 2026 MailFlow Inc. Tất cả quyền được bảo lưu.</p>
                <p>
                  Bạn nhận được email này theo yêu cầu nhận tin.{' '}
                  <span className="underline text-blue-600 cursor-pointer">Hủy đăng ký</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TemplatePreviewDialog
