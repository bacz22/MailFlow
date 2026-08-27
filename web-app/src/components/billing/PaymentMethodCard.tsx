import React from 'react'
import { CreditCard, ShieldCheck, Building2, Edit3 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { usePermission, PERMISSIONS } from '../../permissions'
import type { PaymentMethod, BillingDetails } from '../../types/billing.types'

export interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod
  billing: BillingDetails
  onUpdatePayment: () => void
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  billing,
  onUpdatePayment,
}) => {
  const { hasPermission } = usePermission()
  const canManageBilling = hasPermission(PERMISSIONS.BILLING_MANAGE)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Payment Method Card */}
      <Card className="border border-slate-200/90 dark:border-slate-800/90">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Phương Thức Thanh Toán Mặc Định</CardTitle>
          </div>
          {canManageBilling && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-700"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={onUpdatePayment}
            >
              Cập Nhật
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          {/* Credit Card Visual */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-slate-300 font-bold">
                {paymentMethod.brand}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Mặc định
              </span>
            </div>

            <div className="font-mono text-lg font-bold tracking-widest text-slate-100">
              •••• •••• •••• {paymentMethod.last4}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Chủ Thẻ</div>
                <div className="font-semibold">{paymentMethod.holderName}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase">Hết Hạn</div>
                <div className="font-mono font-semibold">{paymentMethod.expiry}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thanh toán mã hóa bảo mật 256-bit chuẩn quốc tế PCI-DSS Level 1.</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Tax & VAT Electronic Invoice Card */}
      <Card className="border border-slate-200/90 dark:border-slate-800/90">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Thông Tin Xuất Hóa Đơn VAT Điện Tử</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Hóa đơn GTGT điện tử sẽ tự động gửi về email kế toán sau mỗi kỳ thanh toán.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Tên đơn vị / Doanh nghiệp:</span>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {billing.companyTaxName}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px]">Mã số thuế doanh nghiệp (MST):</span>
            <div className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {billing.companyTaxCode}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px]">Địa chỉ đăng ký kinh doanh:</span>
            <div className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
              {billing.companyAddress}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentMethodCard
