import React, { useEffect, useState } from 'react'
import {
  CreditCard,
  Zap,
  Receipt,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { UsageQuotaWidget } from '../components/billing/UsageQuotaWidget'
import { FeatureComingSoon } from '../components/ui/FeatureComingSoon'
import { usePermission, PERMISSIONS } from '../permissions'
import { quotaService } from '../services/quota.service'
import { formatResetLabel } from '../types/quota.types'
import type { UsageQuota } from '../types/billing.types'

export interface BillingPageProps {
  onNavigate: (path: string) => void
  subSection?: 'overview' | 'usage' | 'invoices'
}

export const BillingPage: React.FC<BillingPageProps> = ({
  onNavigate,
  subSection = 'overview',
}) => {
  const { hasPermission } = usePermission()
  const canManageBilling = hasPermission(PERMISSIONS.BILLING_MANAGE)

  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'invoices'>(subSection)
  const [emailsUsage, setEmailsUsage] = useState<UsageQuota>({
    current: 0,
    limit: 50,
    unit: 'email',
    resetDate: '—',
  })

  useEffect(() => {
    setActiveTab(subSection)
  }, [subSection])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const q = await quotaService.getDailySend()
        if (cancelled) return
        setEmailsUsage({
          current: q.used,
          limit: q.limit,
          unit: 'email',
          resetDate: formatResetLabel(q.resetAt),
        })
      } catch {
        // keep defaults
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleTabChange = (tab: 'overview' | 'usage' | 'invoices') => {
    setActiveTab(tab)
    if (tab === 'overview') onNavigate('/settings/billing')
    else if (tab === 'usage') onNavigate('/settings/billing/usage')
    else if (tab === 'invoices') onNavigate('/settings/billing/invoices')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gói Cước, Thanh Toán & Hạn Ngạch (Billing & Usage)"
        description="Theo dõi hạn mức gửi email demo theo ngày. Thanh toán & hóa đơn sẽ bổ sung ở giai đoạn sau."
      />

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        {[
          { id: 'overview' as const, label: 'Tổng Quan & Gói Cước', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'usage' as const, label: 'Tình Trạng Hạn Ngạch (Usage)', icon: <Zap className="w-4 h-4" /> },
          { id: 'invoices' as const, label: 'Lịch Sử Hóa Đơn (Invoices)', icon: <Receipt className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-0">
          <Card className="border-blue-200 dark:border-blue-900/60">
            <CardContent className="p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Demo Free</h3>
                <Badge variant="success" className="text-xs font-bold">
                  Đang Kích Hoạt
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Gói demo: tối đa <strong>{emailsUsage.limit}</strong> email/ngày/workspace (reset 00:00 GMT+7).
                {canManageBilling ? ' Nâng cấp gói trả phí sẽ có ở giai đoạn production.' : ''}
              </p>
              <div className="text-2xl font-extrabold font-mono text-blue-600">0 đ / tháng</div>
            </CardContent>
          </Card>

          <UsageQuotaWidget emailsUsage={emailsUsage} showContacts={false} />

          {/* Mock: CurrentPlanCard / PaymentMethodCard / PlanSelector — ẩn tạm */}
          <FeatureComingSoon title="Thanh toán, nâng cấp gói & xuất hóa đơn VAT" />
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-6 animate-in fade-in-0">
          <UsageQuotaWidget emailsUsage={emailsUsage} showContacts={false} />
          <FeatureComingSoon title="Hạn ngạch danh bạ & tài nguyên hạ tầng" />
        </div>
      )}

      {activeTab === 'invoices' && (
        <FeatureComingSoon title="Lịch sử hóa đơn & chứng từ VAT" />
      )}
    </div>
  )
}

export default BillingPage
