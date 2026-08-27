import React, { useState } from 'react'
import {
  Monitor,
  Smartphone,
  Send,
  User,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { SendTestDialog } from '../../templates/SendTestDialog'
import type {
  CampaignStep1Info,
  CampaignStep3Content,
  CampaignStep4PreviewTest,
} from '../../../types/campaignWizard.types'

export interface SampleContact {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  company: string
  phone: string
}

export const SAMPLE_TEST_CONTACTS: SampleContact[] = [
  {
    id: 'cnt-1',
    fullName: 'Nguyễn Văn An',
    firstName: 'An',
    lastName: 'Nguyễn Văn',
    email: 'an.nguyen@vcorp.vn',
    company: 'V-Corp Global',
    phone: '+84 912 345 678',
  },
  {
    id: 'cnt-2',
    fullName: 'Phạm Thu Hương',
    firstName: 'Hương',
    lastName: 'Phạm Thu',
    email: 'huong.pham@fintech.asia',
    company: 'Fintech Asia Hub',
    phone: '+84 903 555 789',
  },
  {
    id: 'cnt-3',
    fullName: 'Trần Minh Tuấn',
    firstName: 'Tuấn',
    lastName: 'Trần Minh',
    email: 'tuan.tran@techlead.io',
    company: 'TechLead Solutions',
    phone: '+84 988 123 456',
  },
]

export interface CampaignStep4PreviewTestFormProps {
  step1: CampaignStep1Info
  step3: CampaignStep3Content
  data: CampaignStep4PreviewTest
  onChange: (data: Partial<CampaignStep4PreviewTest>) => void
}

export const CampaignStep4PreviewTestForm: React.FC<CampaignStep4PreviewTestFormProps> = ({
  step1,
  step3,
  data: _data,
  onChange,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [selectedContact, setSelectedContact] = useState<SampleContact>(SAMPLE_TEST_CONTACTS[0])
  const [isSendTestOpen, setIsSendTestOpen] = useState(false)

  // Pre-flight validation checks
  const hasUnsubscribe =
    (step3.htmlContent || '').includes('unsubscribe') ||
    (step3.htmlContent || '').includes('hủy đăng ký') ||
    (step3.htmlContent || '').includes('{{unsubscribeUrl}}')
  const hasSender = !!step1.senderEmail
  const isContentEmpty = !step3.htmlContent || step3.htmlContent.trim().length === 0

  // Check for broken variables (e.g. {{invalid_var}})
  const detectedVariables = (step3.htmlContent || '').match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || []
  const knownVariables = [
    '{{firstName}}',
    '{{lastName}}',
    '{{email}}',
    '{{company}}',
    '{{phone}}',
    '{{unsubscribeUrl}}',
  ]
  const invalidVariables = detectedVariables.filter((v) => !knownVariables.includes(v))

  // Render subject and HTML with selected sample contact
  const resolveVariables = (text: string) => {
    if (!text) return ''
    return text
      .replace(/\{\{firstName\}\}/g, `<strong>${selectedContact.firstName}</strong>`)
      .replace(/\{\{lastName\}\}/g, `<strong>${selectedContact.lastName}</strong>`)
      .replace(/\{\{email\}\}/g, `<span class="text-blue-600">${selectedContact.email}</span>`)
      .replace(/\{\{company\}\}/g, `<strong>${selectedContact.company}</strong>`)
      .replace(/\{\{phone\}\}/g, `<span>${selectedContact.phone}</span>`)
      .replace(
        /\{\{unsubscribeUrl\}\}/g,
        `<span class="underline text-blue-500 cursor-pointer">hủy nhận thư tại đây (RFC 8058)</span>`
      )
  }

  const resolvedSubject = resolveVariables(step1.subject || '(Chưa nhập tiêu đề)')
  const resolvedBody = resolveVariables(step3.htmlContent || '')

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* 1. TOP CONTROL BAR: DEVICE TOGGLE, SAMPLE CONTACT SELECTOR & SEND TEST BUTTON */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Sample Contact Selector for Live Personalization */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <User className="w-4 h-4 text-blue-600" />
            <span>Mô Phỏng Cá Nhân Hóa Theo:</span>
          </div>

          <select
            value={selectedContact.id}
            onChange={(e) => {
              const found = SAMPLE_TEST_CONTACTS.find((c) => c.id === e.target.value)
              if (found) setSelectedContact(found)
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus-ring cursor-pointer"
          >
            {SAMPLE_TEST_CONTACTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.company} • {c.email})
              </option>
            ))}
          </select>
        </div>

        {/* Device Switcher & Send Test Trigger */}
        <div className="flex items-center gap-3 self-end lg:self-auto flex-wrap">
          {/* Device Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
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
              onClick={() => setDevice('mobile')}
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

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            onClick={() => setIsSendTestOpen(true)}
          >
            Gửi Thử Nghiệm (Send Test)
          </Button>
        </div>
      </div>

      {/* 2. PRE-FLIGHT AUDIT WARNINGS */}
      {(!hasUnsubscribe || !hasSender || isContentEmpty || invalidVariables.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Khuyến Nghị An Toàn & Tuân Thủ Trước Khi Gửi:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-700/90 dark:text-amber-400 text-[11px]">
            {isContentEmpty && <li>Nội dung thư đang trống. Vui lòng nhập nội dung ở Bước 3.</li>}
            {!hasSender && <li>Chưa chọn người gửi đã xác thực DKIM. Vui lòng chọn ở Bước 1.</li>}
            {invalidVariables.length > 0 && (
              <li>
                Phát hiện biến không xác định: {invalidVariables.join(', ')}. Hãy dùng các biến chuẩn
                như {'{{firstName}}'}, {'{{company}}'}.
              </li>
            )}
            {!hasUnsubscribe && (
              <li>
                Thư chưa chứa liên kết hủy đăng ký. Hệ thống MailFlow sẽ tự động bổ sung tiêu đề RFC 8058 1-click unsubscribe khi phát hành.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* 3. SIMULATED EMAIL INBOX CONTAINER */}
      <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-start justify-center min-h-[580px] overflow-y-auto">
        <div
          className={`transition-all duration-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden ${
            device === 'mobile' ? 'w-[360px] min-h-[580px]' : 'w-full max-w-2xl min-h-[500px]'
          }`}
        >
          {/* Simulated Email Client Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-2 text-xs select-none">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {step1.senderName || 'MailFlow Sender'}
                </span>
                <span className="font-mono">&lt;{step1.senderEmail || 'newsletter@mailflow.vn'}&gt;</span>
              </div>
              <span className="shrink-0 font-mono">10:00 AM</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Gửi tới:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {selectedContact.fullName} &lt;{selectedContact.email}&gt;
              </strong>
            </div>

            {/* Resolved Subject */}
            <div
              className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm pt-1"
              dangerouslySetInnerHTML={{ __html: resolvedSubject }}
            />

            {step1.previewText && (
              <div className="text-[11px] text-slate-500 truncate">
                {step1.previewText}
              </div>
            )}
          </div>

          {/* Rendered Email Body Canvas */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Top Brand Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                MailFlow Communication
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {step1.campaignName || 'Chiến Dịch Email'}
              </h3>
            </div>

            {/* HTML / Rich Text Rendered Content */}
            <div
              className="text-xs sm:text-sm leading-relaxed space-y-3 prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: resolvedBody || '<p class="text-slate-400 italic">Chưa có nội dung thư.</p>',
              }}
            />

            {/* Call to Action Button */}
            <div className="pt-2 text-center">
              <span className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer">
                Xem Chi Tiết Ngay
              </span>
            </div>

            {/* RFC 8058 1-Click Unsubscribe Footer */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-1.5 text-[10px] text-slate-400">
              <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bảo mật DKIM/SPF & RFC 8058 1-Click Unsubscribe</span>
              </div>
              <p>© 2026 MailFlow Inc. 54 Liễu Giai, Ba Đình, Hà Nội.</p>
              <p>
                Email này được gửi đến {selectedContact.email} theo đăng ký của doanh nghiệp {selectedContact.company}.{' '}
                <span className="underline text-blue-600 cursor-pointer">Hủy đăng ký tại đây</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SEND TEST DIALOG */}
      <SendTestDialog
        isOpen={isSendTestOpen}
        onClose={() => {
          setIsSendTestOpen(false)
          onChange({ isTestSent: true })
        }}
        templateName={step1.campaignName}
        subject={step1.subject}
      />
    </div>
  )
}

export default CampaignStep4PreviewTestForm
