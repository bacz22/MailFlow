import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CampaignWizardStepper } from '../components/campaigns/wizard/CampaignWizardStepper'
import { CampaignWizardFooter } from '../components/campaigns/wizard/CampaignWizardFooter'
import { CampaignDraftIndicator } from '../components/campaigns/wizard/CampaignDraftIndicator'
import { CampaignStep1InfoForm } from '../components/campaigns/wizard/CampaignStep1InfoForm'
import { CampaignStep2AudienceForm } from '../components/campaigns/wizard/CampaignStep2AudienceForm'
import { CampaignStep3ContentForm } from '../components/campaigns/wizard/CampaignStep3ContentForm'
import { CampaignStep4PreviewTestForm } from '../components/campaigns/wizard/CampaignStep4PreviewTestForm'
import { CampaignStep5ScheduleForm } from '../components/campaigns/wizard/CampaignStep5ScheduleForm'
import { CampaignStep6ReviewForm } from '../components/campaigns/wizard/CampaignStep6ReviewForm'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import type {
  CampaignWizardStep,
  CampaignWizardState,
} from '../types/campaignWizard.types'

const INITIAL_WIZARD_STATE: CampaignWizardState = {
  step1: {
    campaignName: 'Chiến Dịch Tháng 8 - Tối Ưu Tỷ Lệ Mở Hộp Thư',
    subject: '🔥 5 Chiến lược gửi email đạt 99.8% Inbox Rate cùng MailFlow',
    previewText: 'Bí quyết cấu hình DKIM/SPF và tuân thủ RFC 8058 cho doanh nghiệp.',
    senderId: 'snd-1',
    senderName: 'MailFlow Product Team',
    senderEmail: 'newsletter@mailflow.vn',
    replyTo: 'newsletter@mailflow.vn',
  },
  step2: {
    selectedListIds: ['lst-1'],
    selectedSegmentIds: ['seg-1'],
    excludedListIds: [],
    estimatedRecipients: 7735,
  },
  step3: {
    templateId: 'tpl-1',
    templateName: 'Product Launch 2.0 - Dark & Light Modern',
    htmlContent: '<p>Xin chào <strong>{{firstName}}</strong>,</p><p>Khám phá bản cập nhật MailFlow 2.0 ngay hôm nay.</p>',
  },
  step4: {
    testEmail: 'developer@mailflow.vn',
    isTestSent: true,
  },
  step5: {
    sendType: 'immediate',
    batchSpeed: 'fast',
  },
}

export interface CampaignWizardPageProps {
  onNavigate: (path: string) => void
}

export const CampaignWizardPage: React.FC<CampaignWizardPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()
  const canSend = hasPermission(PERMISSIONS.CAMPAIGN_SEND)

  // Stepper & State
  const [currentStep, setCurrentStep] = useState<CampaignWizardStep>(1)
  const [wizardData, setWizardData] = useState<CampaignWizardState>(INITIAL_WIZARD_STATE)
  const [isDirty, setIsDirty] = useState(false)
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1, 2, 3, 5 validation
  const isStep1Valid =
    !!wizardData.step1.campaignName.trim() &&
    !!wizardData.step1.subject.trim() &&
    !!wizardData.step1.senderId

  const isStep2Valid =
    wizardData.step2.estimatedRecipients > 0 ||
    wizardData.step2.selectedListIds.length > 0 ||
    wizardData.step2.selectedSegmentIds.length > 0

  const isStep3Valid = !!(wizardData.step3.htmlContent || '').trim()

  const isStep5Valid =
    wizardData.step5.sendType === 'immediate' ||
    (wizardData.step5.sendType === 'scheduled' &&
      new Date(
        `${wizardData.step5.scheduledDate || ''}T${wizardData.step5.scheduledTime || '20:00'}`
      ).getTime() >= Date.now() - 60000)

  // Step navigation
  const handleContinue = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as CampaignWizardStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CampaignWizardStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSubmitting(false)
    setIsDirty(false)
    showToast({
      type: 'success',
      title: 'Đã lưu bản nháp',
      description: `Bản nháp "${wizardData.step1.campaignName}" đã được lưu an toàn.`,
    })
  }

  const handlePublish = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSubmitting(false)

    if (canSend) {
      if (wizardData.step5.sendType === 'immediate') {
        showToast({
          type: 'success',
          title: 'Đã đưa vào hàng đợi gửi (Queue)',
          description: `Chiến dịch "${wizardData.step1.campaignName}" đang được phân phối tới ${wizardData.step2.estimatedRecipients.toLocaleString()} người nhận!`,
        })
      } else {
        showToast({
          type: 'success',
          title: 'Lập lịch thành công',
          description: `Chiến dịch "${wizardData.step1.campaignName}" sẽ tự động gửi lúc ${wizardData.step5.scheduledTime}, ${wizardData.step5.scheduledDate}.`,
        })
      }
    } else {
      showToast({
        type: 'success',
        title: 'Đã gửi yêu cầu phê duyệt',
        description: `Chiến dịch "${wizardData.step1.campaignName}" đã được chuyển tới Admin để kiểm duyệt trước khi phát hành.`,
      })
    }

    onNavigate('/campaigns')
  }

  const handleExitConfirm = () => {
    if (isDirty) {
      setIsExitDialogOpen(true)
    } else {
      onNavigate('/campaigns')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Page Header with Draft Indicator */}
      <PageHeader
        title="Trình Tạo Chiến Dịch (Campaign Wizard)"
        description="Quy trình 6 bước chuẩn mực giúp thiết lập thông tin, đối tượng, nội dung, xem trước thử nghiệm và lập lịch phát hành email."
        badge={
          <Badge variant="default" className="text-xs font-mono font-bold">
            Bước {currentStep} / 6
          </Badge>
        }
        actions={
          <div className="flex items-center gap-3">
            <CampaignDraftIndicator isDirty={isDirty} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitConfirm}
            >
              Thoát
            </Button>
          </div>
        }
      />

      {/* 2. HORIZONTAL STEPPER */}
      <CampaignWizardStepper
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* 3. STEP CONTENT FORMS */}

      {/* ================= STEP 1: CAMPAIGN INFORMATION ================= */}
      {currentStep === 1 && (
        <CampaignStep1InfoForm
          data={wizardData.step1}
          onChange={(updated) => {
            setIsDirty(true)
            setWizardData((prev) => ({
              ...prev,
              step1: { ...prev.step1, ...updated },
            }))
          }}
          onNavigateSettings={() => onNavigate('/settings')}
        />
      )}

      {/* ================= STEP 2: AUDIENCE SELECTION ================= */}
      {currentStep === 2 && (
        <CampaignStep2AudienceForm
          data={wizardData.step2}
          onChange={(updated) => {
            setIsDirty(true)
            setWizardData((prev) => ({
              ...prev,
              step2: { ...prev.step2, ...updated },
            }))
          }}
        />
      )}

      {/* ================= STEP 3: CONTENT & TEMPLATE ================= */}
      {currentStep === 3 && (
        <CampaignStep3ContentForm
          data={wizardData.step3}
          campaignSubject={wizardData.step1.subject}
          campaignPreviewText={wizardData.step1.previewText}
          onChange={(updated) => {
            setIsDirty(true)
            setWizardData((prev) => ({
              ...prev,
              step3: { ...prev.step3, ...updated },
            }))
          }}
        />
      )}

      {/* ================= STEP 4: PREVIEW & TEST ================= */}
      {currentStep === 4 && (
        <CampaignStep4PreviewTestForm
          step1={wizardData.step1}
          step3={wizardData.step3}
          data={wizardData.step4}
          onChange={(updated) => {
            setIsDirty(true)
            setWizardData((prev) => ({
              ...prev,
              step4: { ...prev.step4, ...updated },
            }))
          }}
        />
      )}

      {/* ================= STEP 5: SCHEDULE & SPEED ================= */}
      {currentStep === 5 && (
        <CampaignStep5ScheduleForm
          data={wizardData.step5}
          onChange={(updated) => {
            setIsDirty(true)
            setWizardData((prev) => ({
              ...prev,
              step5: { ...prev.step5, ...updated },
            }))
          }}
        />
      )}

      {/* ================= STEP 6: REVIEW & AUDIT (PROMPT 20) ================= */}
      {currentStep === 6 && (
        <CampaignStep6ReviewForm
          wizardData={wizardData}
          onJumpToStep={(step) => {
            setCurrentStep(step)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onConfirmSubmit={handlePublish}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 4. STEPPER FOOTER ACTIONS */}
      <CampaignWizardFooter
        currentStep={currentStep}
        isContinueDisabled={
          (currentStep === 1 && !isStep1Valid) ||
          (currentStep === 2 && !isStep2Valid) ||
          (currentStep === 3 && !isStep3Valid) ||
          (currentStep === 5 && !isStep5Valid)
        }
        isSubmitting={isSubmitting}
        onBack={handleBack}
        onContinue={handleContinue}
        onSaveDraft={handleSaveDraft}
        onExit={handleExitConfirm}
        onPublish={handlePublish}
      />

      {/* 5. UNSAVED CHANGES WARNING DIALOG */}
      <Dialog open={isExitDialogOpen} onOpenChange={() => setIsExitDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Thoát Khỏi Trình Tạo Chiến Dịch?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Các thông tin vừa thiết lập sẽ được lưu lại dưới dạng bản nháp để bạn có thể tiếp tục bất cứ lúc nào.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsExitDialogOpen(false)
                onNavigate('/campaigns')
              }}
            >
              Thoát
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                await handleSaveDraft()
                setIsExitDialogOpen(false)
                onNavigate('/campaigns')
              }}
            >
              Lưu Nháp & Thoát
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CampaignWizardPage
