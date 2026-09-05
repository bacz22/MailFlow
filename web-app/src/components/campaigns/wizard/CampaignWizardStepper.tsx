import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { CampaignWizardStep } from '../../../types/campaignWizard.types'

export interface CampaignWizardStepperProps {
  currentStep: CampaignWizardStep
  onStepClick?: (step: CampaignWizardStep) => void
}

export const WIZARD_STEPS: { step: CampaignWizardStep; title: string; subtitle: string }[] = [
  { step: 1, title: 'Thông Tin', subtitle: 'Tiêu đề & Người gửi' },
  { step: 2, title: 'Đối Tượng', subtitle: 'Danh sách & Phân đoạn' },
  { step: 3, title: 'Nội Dung', subtitle: 'Mẫu thư & Biến động' },
  { step: 4, title: 'Xem & Thử', subtitle: 'Mô phỏng & Gửi test' },
  { step: 5, title: 'Lịch Gửi', subtitle: 'Thời gian phát hành' },
  { step: 6, title: 'Tổng Quan', subtitle: 'Kiểm tra & Phát hành' },
]

export const CampaignWizardStepper: React.FC<CampaignWizardStepperProps> = ({
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-3">
      {/* Mobile Compact Progress Bar */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Bước {currentStep}/6: {WIZARD_STEPS[currentStep - 1].title}
          </span>
          <span className="text-blue-600 font-mono font-bold">
            {Math.round((currentStep / 6) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            style={{ width: `${(currentStep / 6) * 100}%` }}
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />

        {WIZARD_STEPS.map((s) => {
          const isCompleted = currentStep > s.step
          const isCurrent = currentStep === s.step
          const isAccessible = currentStep >= s.step

          return (
            <div
              key={s.step}
              className={`relative z-10 flex flex-col items-center group ${
                isAccessible && onStepClick ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => {
                if (isAccessible && onStepClick) {
                  onStepClick(s.step)
                }
              }}
            >
              {/* Step Circle Indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30 scale-110'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
              </div>

              {/* Step Title & Subtitle */}
              <div className="text-center mt-1.5 space-y-0.5">
                <div
                  className={`text-[11px] font-bold ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </div>
                <div className="text-[10px] text-slate-400 hidden md:block">
                  {s.subtitle}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CampaignWizardStepper
