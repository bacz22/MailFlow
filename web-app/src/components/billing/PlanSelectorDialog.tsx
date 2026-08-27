import React, { useState } from 'react'
import { Crown, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import type { PlanTier } from '../../types/billing.types'

export interface PlanSelectorDialogProps {
  isOpen: boolean
  onClose: () => void
  currentTier: PlanTier
  onSelectPlan: (tier: PlanTier) => void
}

interface PlanOption {
  tier: PlanTier
  name: string
  price: string
  description: string
  features: string[]
  isPopular?: boolean
}

const AVAILABLE_PLANS: PlanOption[] = [
  {
    tier: 'STARTER',
    name: 'Gói Cơ Bản (Starter)',
    price: '490,000 đ',
    description: 'Dành cho doanh nghiệp nhỏ bắt đầu làm email marketing.',
    features: [
      '15,000 email gửi / tháng',
      '5,000 liên hệ danh bạ',
      'Hạ tầng IP chia sẻ tối ưu',
      'Hỗ trợ qua Email trong 24h',
    ],
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Chuyên Nghiệp (Professional)',
    price: '1,290,000 đ',
    description: 'Dành cho công ty đang tăng trưởng lưu lượng gửi thường xuyên.',
    features: [
      '50,000 email gửi / tháng',
      '20,000 liên hệ danh bạ',
      'Cụm IP Pool tốc độ cao',
      'Hỗ trợ ưu tiên 12/7',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Doanh Nghiệp (Enterprise Growth)',
    price: '2,490,000 đ',
    description: 'Hạ tầng Dedicated IP riêng biệt đảm bảo Inbox 99.8%.',
    features: [
      '100,000 email gửi / tháng',
      '50,000 liên hệ danh bạ',
      '1 Dedicated IP cố định riêng',
      'Hỗ trợ kỹ thuật 24/7 SLA 99.9%',
    ],
    isPopular: true,
  },
  {
    tier: 'CUSTOM',
    name: 'Quy Mô Lớn (Custom Dedicated)',
    price: 'Liên hệ',
    description: 'Tùy chỉnh cụm máy chủ và hạn ngạch không giới hạn.',
    features: [
      '> 1,000,000+ email gửi / tháng',
      'Không giới hạn danh bạ',
      'Cụm Dedicated IP Cluster riêng',
      'Kỹ sư hỗ trợ hạ tầng riêng',
    ],
  },
]

export const PlanSelectorDialog: React.FC<PlanSelectorDialogProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectPlan,
}) => {
  const [selectedTier, setSelectedTier] = useState<PlanTier>(currentTier)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsSubmitting(false)
    onSelectPlan(selectedTier)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <Crown className="w-5 h-5" />
            <DialogTitle>Nâng Cấp & Điều Chỉnh Gói Cước Doanh Nghiệp</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Lựa chọn gói hạn ngạch phù hợp với quy mô danh bạ và nhu cầu phát hành email của tổ chức.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3 text-xs">
          {AVAILABLE_PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier
            const isSelected = selectedTier === plan.tier

            return (
              <div
                key={plan.tier}
                onClick={() => setSelectedTier(plan.tier)}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                    Phổ Biến Nhất
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{plan.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{plan.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                      {plan.price}
                    </span>
                    {plan.price !== 'Liên hệ' && <span className="text-[10px] text-slate-400"> / tháng</span>}
                  </div>

                  <ul className="space-y-2 pt-2 text-[11px] text-slate-700 dark:text-slate-300">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  {isCurrent ? (
                    <span className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-center block text-[11px]">
                      Gói Hiện Tại
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setSelectedTier(plan.tier)}
                    >
                      {isSelected ? 'Đã Chọn' : 'Chọn Gói Này'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={selectedTier === currentTier}
            isLoading={isSubmitting}
            onClick={handleConfirm}
          >
            Xác Nhận Thay Đổi Gói Cước
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PlanSelectorDialog
