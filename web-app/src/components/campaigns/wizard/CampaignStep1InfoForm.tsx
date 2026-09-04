import React, { useRef } from 'react'
import {
  FileText,
  Sparkles,
  Mail,
} from 'lucide-react'
import { Input } from '../../ui/Input'
import { FormField, FormLabel } from '../../ui/FormGroup'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import { SenderSelector } from './SenderSelector'
import type { CampaignStep1Info } from '../../../types/campaignWizard.types'
import type { VerifiedSender } from '../../../types/sender.types'

export interface CampaignStep1InfoFormProps {
  data: CampaignStep1Info
  onChange: (data: Partial<CampaignStep1Info>, markDirty?: boolean) => void
  onNavigateSettings?: () => void
}

const SUBJECT_VARIABLES = [
  { key: '{{firstName}}', label: 'Tên Khách' },
  { key: '{{company}}', label: 'Tên Công Ty' },
  { key: '{{lastName}}', label: 'Họ & Đệm' },
]

export const CampaignStep1InfoForm: React.FC<CampaignStep1InfoFormProps> = ({
  data,
  onChange,
  onNavigateSettings,
}) => {
  const subjectInputRef = useRef<HTMLInputElement>(null)

  // Insert variable into subject input at cursor position
  const handleInsertSubjectVar = (vKey: string) => {
    const input = subjectInputRef.current
    if (!input) {
      onChange({ subject: (data.subject || '') + ' ' + vKey })
      return
    }

    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const current = data.subject || ''
    const updated = current.substring(0, start) + vKey + current.substring(end)

    onChange({ subject: updated })

    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + vKey.length, start + vKey.length)
    }, 50)
  }

  const handleSelectSender = (sender: VerifiedSender, markDirty: boolean = true) => {
    onChange({
      senderId: sender.id,
      senderName: sender.name,
      senderEmail: sender.email,
      replyTo: data.replyTo || sender.email,
    }, markDirty)
  }

  const subjectCharCount = (data.subject || '').length

  return (
    <Card className="animate-in fade-in-0">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-base">Bước 1: Thông Tin Chiến Dịch & Địa Chỉ Gửi</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Cung cấp tên định danh nội bộ, tiêu đề thư gửi đến hộp thư người nhận và lựa chọn người gửi đã xác thực DKIM/SPF.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* 1. Campaign Name (Internal only) */}
        <FormField>
          <div className="flex items-center justify-between">
            <FormLabel required>Tên Chiến Dịch (Campaign Name)</FormLabel>
            <span className="text-[11px] text-slate-400">Chỉ hiển thị cho nội bộ quản trị</span>
          </div>
          <Input
            placeholder="Ví dụ: Bản Tin Công Nghệ Tháng 8 / Flash Sale 30%..."
            value={data.campaignName}
            onChange={(e) => onChange({ campaignName: e.target.value })}
            autoFocus
          />
        </FormField>

        {/* 2. Email Subject Line with Personalization Variables */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <FormLabel required>Tiêu Đề Email (Subject Line)</FormLabel>
            {/* Subject Length Guidance */}
            <div className="text-[11px] font-mono">
              <span
                className={
                  subjectCharCount > 60
                    ? 'text-amber-500 font-bold'
                    : subjectCharCount >= 30
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-400'
                }
              >
                {subjectCharCount}/60 ký tự
              </span>
              <span className="text-slate-400 ml-1 hidden sm:inline">
                (Khuyên dùng 30 - 60 ký tự cho mobile)
              </span>
            </div>
          </div>

          <div className="relative">
            <Input
              ref={subjectInputRef}
              placeholder="Nhập tiêu đề hiển thị trong Inbox người nhận..."
              value={data.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
            />
          </div>

          {/* Quick Subject Variable Picker Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Chèn biến cá nhân hóa:</span>
            </span>
            {SUBJECT_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => handleInsertSubjectVar(v.key)}
                className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition cursor-pointer"
                title={`Chèn ${v.label}`}
              >
                + {v.key}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Preview Text / Preheader */}
        <FormField>
          <div className="flex items-center justify-between">
            <FormLabel>Đoạn Văn Xem Trước (Preview Text / Preheader)</FormLabel>
            <span className="text-[11px] text-slate-400">Tùy chọn</span>
          </div>
          <Input
            placeholder="Đoạn văn tóm tắt xuất hiện ngay cạnh tiêu đề trong Gmail / Apple Mail..."
            value={data.previewText}
            onChange={(e) => onChange({ previewText: e.target.value })}
          />
        </FormField>

        {/* 4. Sender Selector Component */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <SenderSelector
            selectedSenderId={data.senderId}
            onSelectSender={handleSelectSender}
            onNavigateSettings={onNavigateSettings}
          />
        </div>

        {/* 5. Reply-To Email */}
        <FormField>
          <div className="flex items-center justify-between">
            <FormLabel>Địa Chỉ Nhận Phản Hồi (Reply-To)</FormLabel>
            <span className="text-[11px] text-slate-400">Khi người nhận bấm Trả lời</span>
          </div>
          <Input
            type="email"
            placeholder="reply@congty.com"
            value={data.replyTo}
            onChange={(e) => onChange({ replyTo: e.target.value })}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />
        </FormField>
      </CardContent>
    </Card>
  )
}

export default CampaignStep1InfoForm
