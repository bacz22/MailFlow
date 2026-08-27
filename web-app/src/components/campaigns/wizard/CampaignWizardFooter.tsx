import React from 'react'
import { ArrowLeft, ArrowRight, Save, X, Send } from 'lucide-react'
import { Button } from '../../ui/Button'
import type { CampaignWizardStep } from '../../../types/campaignWizard.types'

export interface CampaignWizardFooterProps {
  currentStep: CampaignWizardStep
  isContinueDisabled?: boolean
  isSubmitting?: boolean
  onBack: () => void
  onContinue: () => void
  onSaveDraft: () => void
  onExit: () => void
  onPublish?: () => void
}

export const CampaignWizardFooter: React.FC<CampaignWizardFooterProps> = ({
  currentStep,
  isContinueDisabled = false,
  isSubmitting = false,
  onBack,
  onContinue,
  onSaveDraft,
  onExit,
  onPublish,
}) => {
  const isFinalStep = currentStep === 6

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      {/* Left: Exit & Back */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-rose-600"
          leftIcon={<X className="w-3.5 h-3.5" />}
          onClick={onExit}
        >
          Thoát Wizard
        </Button>

        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={onBack}
          >
            Quay Lại
          </Button>
        )}
      </div>

      {/* Right: Save Draft & Continue / Publish */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Save className="w-3.5 h-3.5" />}
          onClick={onSaveDraft}
        >
          Lưu Nháp
        </Button>

        {isFinalStep ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            onClick={onPublish}
          >
            Phát Hành Chiến Dịch
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isContinueDisabled}
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={onContinue}
          >
            Tiếp Tục: Bước {currentStep + 1}
          </Button>
        )}
      </div>
    </div>
  )
}

export default CampaignWizardFooter
