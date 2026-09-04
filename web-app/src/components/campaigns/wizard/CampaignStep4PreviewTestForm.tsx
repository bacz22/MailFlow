import React, { useEffect, useState } from 'react'
import {
  Monitor,
  Smartphone,
  Send,
  User,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { SimpleSelect } from '../../ui/Select'
import { TemplatePreview } from '../../templates/TemplatePreview'
import { SendTestDialog } from '../../templates/SendTestDialog'
import { templateService } from '../../../services/template.service'
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
  campaignId?: string
  step1: CampaignStep1Info
  step3: CampaignStep3Content
  data: CampaignStep4PreviewTest
  onChange: (data: Partial<CampaignStep4PreviewTest>) => void
  onStep3LayoutChange?: (layout: Partial<CampaignStep3Content>) => void
}

export const CampaignStep4PreviewTestForm: React.FC<CampaignStep4PreviewTestFormProps> = ({
  campaignId,
  step1,
  step3,
  data: _data,
  onChange,
  onStep3LayoutChange,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [selectedContact, setSelectedContact] = useState<SampleContact>(SAMPLE_TEST_CONTACTS[0])
  const [isSendTestOpen, setIsSendTestOpen] = useState(false)

  // If campaign was saved with templateId but layout fields missing (edit reload), hydrate from API
  useEffect(() => {
    if (!step3.templateId) return
    if (step3.thumbnailGradient || step3.bannerLabel || step3.bannerTitle) return
    let cancelled = false
    void (async () => {
      try {
        const tpl = await templateService.get(step3.templateId!)
        if (cancelled || !onStep3LayoutChange) return
        onStep3LayoutChange({
          templateName: tpl.name,
          thumbnailGradient: tpl.thumbnailGradient,
          bannerLabel: tpl.bannerLabel,
          bannerTitle: tpl.bannerTitle,
        })
      } catch {
        // keep defaults
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    step3.templateId,
    step3.thumbnailGradient,
    step3.bannerLabel,
    step3.bannerTitle,
    onStep3LayoutChange,
  ])

  const hasUnsubscribe =
    (step3.htmlContent || '').includes('unsubscribe') ||
    (step3.htmlContent || '').includes('hủy đăng ký') ||
    (step3.htmlContent || '').includes('{{unsubscribeUrl}}')
  const hasSender = !!step1.senderEmail
  const isContentEmpty = !step3.htmlContent || step3.htmlContent.trim().length === 0

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

  // Match backend send-test: template layout if linked, else campaign-name banner
  const previewGradient =
    step3.thumbnailGradient || 'bg-gradient-to-tr from-blue-600 to-indigo-600'
  const previewBannerLabel = step3.templateId
    ? step3.bannerLabel
    : step3.bannerLabel || 'Chiến dịch'
  const previewBannerTitle = step3.bannerTitle?.trim()
    || (step3.templateId ? undefined : step1.campaignName)
    || 'Bản Tin MailFlow'

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 lg:gap-6 items-end">
          <div className="min-w-0 space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Mô phỏng cá nhân hóa theo</span>
            </label>
            <SimpleSelect
              size="sm"
              value={selectedContact.id}
              onValueChange={(id) => {
                const found = SAMPLE_TEST_CONTACTS.find((c) => c.id === id)
                if (found) setSelectedContact(found)
              }}
              options={SAMPLE_TEST_CONTACTS.map((c) => ({
                value: c.id,
                label: `${c.fullName} · ${c.company}`,
                textValue: `${c.fullName} ${c.company} ${c.email}`,
              }))}
              className="w-full max-w-xl rounded-xl font-semibold"
            />
            <p className="text-[11px] text-slate-400 truncate">
              Preview dùng dữ liệu: {selectedContact.email}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end">
            <div
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto"
              role="group"
              aria-label="Chế độ xem trước"
            >
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
              className="w-full sm:w-auto shrink-0"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => setIsSendTestOpen(true)}
            >
              Gửi thử nghiệm
            </Button>
          </div>
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

      {/* 3. Same preview component as template editor */}
      <TemplatePreview
        subject={step1.subject || '(Chưa nhập tiêu đề)'}
        htmlContent={step3.htmlContent || ''}
        device={device}
        thumbnailGradient={previewGradient}
        bannerLabel={previewBannerLabel}
        bannerTitle={previewBannerTitle}
        fromName={step1.senderName || 'MailFlow Sender'}
        fromEmail={step1.senderEmail || 'newsletter@mailflow.vn'}
        toDisplay={`${selectedContact.fullName} <${selectedContact.email}>`}
        sampleRecipient={{
          firstName: selectedContact.firstName,
          lastName: selectedContact.lastName,
          email: selectedContact.email,
          company: selectedContact.company,
          phone: selectedContact.phone,
        }}
      />

      <SendTestDialog
        isOpen={isSendTestOpen}
        onClose={() => {
          setIsSendTestOpen(false)
          onChange({ isTestSent: true })
        }}
        campaignId={campaignId}
        templateName={step1.campaignName}
        subject={step1.subject}
      />
    </div>
  )
}

export default CampaignStep4PreviewTestForm
