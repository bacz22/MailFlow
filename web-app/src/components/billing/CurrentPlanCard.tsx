import React from 'react'
import { Crown, Zap, Calendar, ArrowUpRight, ShieldCheck, Check } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { usePermission, PERMISSIONS } from '../../permissions'
import type { BillingDetails } from '../../types/billing.types'

export interface CurrentPlanCardProps {
  billing: BillingDetails
  onManagePlan: () => void
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  billing,
  onManagePlan,
}) => {
  const { hasPermission } = usePermission()
  const canManageBilling = hasPermission(PERMISSIONS.BILLING_MANAGE)

  return (
    <Card className="border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:to-slate-900/90 shadow-sm relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Crown className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {billing.planName}
                </h3>
                <Badge variant="success" className="text-xs font-bold">
                  Đang Kích Hoạt
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kỳ gia hạn tiếp theo: <strong>{billing.renewalDate}</strong></span>
                </span>
                <span>• Tự động thanh toán</span>
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                {billing.monthlyCost}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ tháng</span>
            </div>

            {canManageBilling && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 text-xs font-bold"
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                onClick={onManagePlan}
              >
                Nâng Cấp / Đổi Gói Cước
              </Button>
            )}
          </div>
        </div>

        {/* Feature inclusions chips */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span><strong>100,000</strong> email gửi/tháng</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap className="w-3 h-3" />
            </div>
            <span><strong>{billing.dedicatedIpsCount} Dedicated IP</strong> cố định</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3 h-3" />
            </div>
            <span>Hỗ trợ kỹ thuật 24/7 SLA 99.9%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CurrentPlanCard
