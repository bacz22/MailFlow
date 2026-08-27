import React from 'react'
import {
  Monitor,
  Smartphone,
  Send,
  Save,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '../ui/Button'

export interface TemplateToolbarProps {
  device: 'desktop' | 'mobile'
  onChangeDevice: (device: 'desktop' | 'mobile') => void
  lastAutosavedAt?: string
  isDirty?: boolean
  isSubmitting?: boolean
  onBack: () => void
  onOpenSendTest: () => void
  onSaveDraft: () => void
  onSaveTemplate: () => void
}

export const TemplateToolbar: React.FC<TemplateToolbarProps> = ({
  device,
  onChangeDevice,
  lastAutosavedAt = 'Vừa xong',
  isDirty = false,
  isSubmitting = false,
  onBack,
  onOpenSendTest,
  onSaveDraft,
  onSaveTemplate,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-4 z-20 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      {/* Left: Back & Autosave Status */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBack}
        >
          Quay Lại
        </Button>

        {/* Autosave Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          {isDirty ? (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-amber-600 dark:text-amber-400">Có thay đổi chưa lưu</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đã tự động lưu nháp ({lastAutosavedAt})</span>
            </>
          )}
        </div>
      </div>

      {/* Middle: Desktop vs Mobile Viewport Switcher */}
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs self-center">
        <button
          type="button"
          onClick={() => onChangeDevice('desktop')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold ${
            device === 'desktop'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Desktop</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeDevice('mobile')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold ${
            device === 'mobile'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Send className="w-3.5 h-3.5 text-indigo-600" />}
          onClick={onOpenSendTest}
        >
          Gửi Thử
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onSaveDraft}
        >
          Lưu Nháp
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          leftIcon={<Save className="w-3.5 h-3.5" />}
          onClick={onSaveTemplate}
        >
          Lưu Mẫu Email
        </Button>
      </div>
    </div>
  )
}

export default TemplateToolbar
