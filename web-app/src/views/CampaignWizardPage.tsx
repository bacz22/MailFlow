import React, { useCallback, useEffect, useState } from 'react'
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
import { Spinner } from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { campaignService, type CampaignDetail, type CampaignWritePayload } from '../services/campaign.service'
import { templateService } from '../services/template.service'
import type {
  CampaignWizardStep,
  CampaignWizardState,
} from '../types/campaignWizard.types'

const EMPTY_WIZARD_STATE: CampaignWizardState = {
  step1: {
    campaignName: '',
    subject: '',
    previewText: '',
    senderId: '',
    senderName: '',
    senderEmail: '',
    replyTo: '',
  },
  step2: {
    selectedListIds: [],
    selectedSegmentIds: [],
    excludedListIds: [],
    estimatedRecipients: 0,
  },
  step3: {
    htmlContent: '',
  },
  step4: {
    testEmail: '',
    isTestSent: false,
  },
  step5: {
    sendType: 'immediate',
    timezone: 'Asia/Bangkok',
  },
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function splitIso(iso?: string): { scheduledDate?: string; scheduledTime?: string } {
  if (!iso) return {}
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return {}
  return {
    scheduledDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    scheduledTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

function toWizardState(campaign: CampaignDetail): CampaignWizardState {
  const schedule = splitIso(campaign.scheduledAtIso)
  return {
    step1: {
      campaignName: campaign.name,
      subject: campaign.subject,
      previewText: campaign.previewText || '',
      senderId: campaign.senderId || '',
      senderName: campaign.senderName || '',
      senderEmail: campaign.senderEmail || '',
      replyTo: campaign.replyTo || '',
    },
    step2: {
      selectedListIds: campaign.listIds,
      selectedSegmentIds: campaign.segmentIds,
      excludedListIds: campaign.excludedListIds,
      estimatedRecipients: campaign.recipientCount,
    },
    step3: {
      templateId: campaign.templateId,
      htmlContent: campaign.htmlContent || '',
    },
    step4: {
      testEmail: '',
      isTestSent: false,
    },
    step5: {
      sendType: campaign.sendType || 'immediate',
      scheduledDate: schedule.scheduledDate,
      scheduledTime: schedule.scheduledTime,
      timezone: 'Asia/Bangkok',
    },
  }
}

function toWritePayload(state: CampaignWizardState): CampaignWritePayload {
  let scheduledAt: string | undefined
  if (state.step5.sendType === 'scheduled' && state.step5.scheduledDate && state.step5.scheduledTime) {
    // Demo: luôn interpret ngày/giờ theo GMT+7 (Asia/Bangkok), khớp QuotaService
    const instant = new Date(
      `${state.step5.scheduledDate}T${state.step5.scheduledTime}:00+07:00`
    )
    if (!Number.isNaN(instant.getTime())) {
      scheduledAt = instant.toISOString()
    }
  }
  return {
    name: state.step1.campaignName.trim(),
    subject: state.step1.subject.trim(),
    previewText: state.step1.previewText.trim() || undefined,
    senderId: state.step1.senderId || undefined,
    replyTo: state.step1.replyTo.trim() || undefined,
    templateId: state.step3.templateId,
    htmlContent: state.step3.htmlContent,
    sendType: state.step5.sendType,
    scheduledAt,
    listIds: state.step2.selectedListIds,
    segmentIds: state.step2.selectedSegmentIds,
    excludedListIds: state.step2.excludedListIds,
  }
}

export interface CampaignWizardPageProps {
  campaignId?: string
  onNavigate: (path: string) => void
}

export const CampaignWizardPage: React.FC<CampaignWizardPageProps> = ({ campaignId, onNavigate }) => {
  const { showToast } = useToast()

  // Stepper & State
  const [currentStep, setCurrentStep] = useState<CampaignWizardStep>(1)
  const [wizardData, setWizardData] = useState<CampaignWizardState>(EMPTY_WIZARD_STATE)
  const [savedId, setSavedId] = useState<string | undefined>(campaignId)
  const [isDirty, setIsDirty] = useState(false)
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCampaign, setIsLoadingCampaign] = useState<boolean>(!!campaignId)

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

  const isStep5Valid = (() => {
    if (wizardData.step5.sendType === 'immediate') return true
    if (wizardData.step5.sendType !== 'scheduled') return false
    const date =
      wizardData.step5.scheduledDate ||
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    const time = wizardData.step5.scheduledTime || '20:00'
    const target = new Date(`${date}T${time}:00+07:00`)
    if (Number.isNaN(target.getTime())) return false
    return target.getTime() >= Date.now() - 60_000
  })()

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

  const persistDraft = useCallback(async (options?: { stay?: boolean }): Promise<string> => {
    const payload = toWritePayload(wizardData)
    if (savedId) {
      await campaignService.update(savedId, payload)
      return savedId
    }
    const created = await campaignService.create(payload)
    setSavedId(created.id)
    if (!options?.stay) {
      onNavigate(`/campaigns/${created.id}/edit`)
    }
    return created.id
  }, [onNavigate, savedId, wizardData])

  useEffect(() => {
    if (!campaignId) {
      setIsLoadingCampaign(false)
      return
    }
    let cancelled = false
    setIsLoadingCampaign(true)
    void (async () => {
      try {
        const campaign = await campaignService.get(campaignId)
        if (cancelled) return
        let next = toWizardState(campaign)
        if (campaign.templateId) {
          try {
            const tpl = await templateService.get(campaign.templateId)
            if (!cancelled) {
              next = {
                ...next,
                step3: {
                  ...next.step3,
                  templateName: tpl.name,
                  thumbnailGradient: tpl.thumbnailGradient,
                  bannerLabel: tpl.bannerLabel,
                  bannerTitle: tpl.bannerTitle,
                },
              }
            }
          } catch {
            // layout defaults if template deleted
          }
        }
        setSavedId(campaign.id)
        setWizardData(next)
        setIsDirty(false)
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Không tải được chiến dịch',
          description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
        })
      } finally {
        if (!cancelled) setIsLoadingCampaign(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [campaignId, showToast])

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    try {
      await persistDraft()
      setIsDirty(false)
      showToast({
        type: 'success',
        title: 'Đã lưu bản nháp',
        description: `Bản nháp "${wizardData.step1.campaignName}" đã được lưu an toàn.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không lưu được bản nháp',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublish = async () => {
    setIsSubmitting(true)
    try {
      const id = await persistDraft({ stay: true })
      await campaignService.submit(id)
      setIsDirty(false)
      showToast({
        type: 'success',
        title: 'Đã gửi yêu cầu phê duyệt',
        description: `Chiến dịch "${wizardData.step1.campaignName}" đã được chuyển tới Admin để kiểm duyệt trước khi phát hành.`,
      })
      onNavigate('/campaigns')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không gửi duyệt được',
        description: error instanceof ApiError ? error.detail : 'Kiểm tra người gửi, nội dung và đối tượng nhận.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExitConfirm = () => {
    if (isDirty) {
      setIsExitDialogOpen(true)
    } else {
      onNavigate('/campaigns')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
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
      {isLoadingCampaign ? (
        <div className="flex items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* ================= STEP 1: CAMPAIGN INFORMATION ================= */}
          {currentStep === 1 && (
            <CampaignStep1InfoForm
              data={wizardData.step1}
              onChange={(updated, markDirty = true) => {
                if (markDirty) {
                  setIsDirty(true)
                }
                setWizardData((prev) => ({
                  ...prev,
                  step1: { ...prev.step1, ...updated },
                }))
              }}
              onNavigateSettings={() => onNavigate('/senders')}
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
          campaignId={savedId}
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
          onStep3LayoutChange={(layout) => {
            setWizardData((prev) => ({
              ...prev,
              step3: { ...prev.step3, ...layout },
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
        </>
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
