import React, { useState } from 'react'
import {
  CreditCard,
  Zap,
  Receipt,
  Download,
  Crown,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FormField, FormLabel } from '../components/ui/FormGroup'
import { CurrentPlanCard } from '../components/billing/CurrentPlanCard'
import { UsageQuotaWidget } from '../components/billing/UsageQuotaWidget'
import { InvoiceTable } from '../components/billing/InvoiceTable'
import { PaymentMethodCard } from '../components/billing/PaymentMethodCard'
import { PlanSelectorDialog } from '../components/billing/PlanSelectorDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import type {
  BillingDetails,
  InvoiceItem,
  PlanTier,
} from '../types/billing.types'

const INITIAL_BILLING: BillingDetails = {
  planTier: 'ENTERPRISE',
  planName: 'Gói Doanh Nghiệp (Enterprise Growth)',
  billingCycle: 'monthly',
  monthlyCost: '2,490,000 đ',
  renewalDate: '01/10/2026',
  emailsUsage: {
    current: 72500,
    limit: 100000,
    unit: 'email',
    resetDate: '01/10/2026',
  },
  contactsUsage: {
    current: 21300,
    limit: 50000,
    unit: 'liên hệ',
    resetDate: '01/10/2026',
  },
  dedicatedIpsCount: 1,
  paymentMethod: {
    id: 'pm-1',
    brand: 'VISA',
    last4: '4242',
    expiry: '12/28',
    holderName: 'NGUYEN VAN ADMIN',
    isDefault: true,
  },
  companyTaxName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ MAILFLOW VIỆT NAM',
  companyTaxCode: '0109887766',
  companyAddress: 'Tầng 12, Tòa nhà Tech Tower, Phố Duy Tân, Cầu Giấy, Hà Nội',
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-08',
    date: '01/08/2026',
    amount: '2,490,000 đ',
    numericAmount: 2490000,
    status: 'PAID',
    description: 'Phí duy trì Gói Doanh Nghiệp (Enterprise Growth) - Tháng 08/2026',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-07',
    date: '01/07/2026',
    amount: '2,490,000 đ',
    numericAmount: 2490000,
    status: 'PAID',
    description: 'Phí duy trì Gói Doanh Nghiệp (Enterprise Growth) - Tháng 07/2026',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-06',
    date: '01/06/2026',
    amount: '1,290,000 đ',
    numericAmount: 1290000,
    status: 'PAID',
    description: 'Phí duy trì Gói Chuyên Nghiệp (Professional) - Tháng 06/2026',
  },
]

export interface BillingPageProps {
  onNavigate: (path: string) => void
  subSection?: 'overview' | 'usage' | 'invoices'
}

export const BillingPage: React.FC<BillingPageProps> = ({
  onNavigate,
  subSection = 'overview',
}) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'invoices'>(subSection)
  const [billing, setBilling] = useState<BillingDetails>(INITIAL_BILLING)
  const [invoices, _setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES)

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isUpdateCardOpen, setIsUpdateCardOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceItem | null>(null)

  // Card update form state
  const [cardHolder, setCardHolder] = useState(billing.paymentMethod.holderName)
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState(billing.paymentMethod.expiry)
  const [isSavingCard, setIsSavingCard] = useState(false)

  const canManageBilling = hasPermission(PERMISSIONS.BILLING_MANAGE)

  const handleTabChange = (tab: 'overview' | 'usage' | 'invoices') => {
    setActiveTab(tab)
    if (tab === 'overview') onNavigate('/settings/billing')
    else if (tab === 'usage') onNavigate('/settings/billing/usage')
    else if (tab === 'invoices') onNavigate('/settings/billing/invoices')
  }

  const handleSelectPlan = (tier: PlanTier) => {
    let planName = 'Gói Doanh Nghiệp (Enterprise Growth)'
    let cost = '2,490,000 đ'
    let emailLimit = 100000
    let contactLimit = 50000

    if (tier === 'STARTER') {
      planName = 'Gói Cơ Bản (Starter)'
      cost = '490,000 đ'
      emailLimit = 15000
      contactLimit = 5000
    } else if (tier === 'PROFESSIONAL') {
      planName = 'Gói Chuyên Nghiệp (Professional)'
      cost = '1,290,000 đ'
      emailLimit = 50000
      contactLimit = 20000
    } else if (tier === 'CUSTOM') {
      planName = 'Gói Quy Mô Lớn (Custom Dedicated)'
      cost = 'Liên hệ'
      emailLimit = 1000000
      contactLimit = 500000
    }

    setBilling((prev) => ({
      ...prev,
      planTier: tier,
      planName,
      monthlyCost: cost,
      emailsUsage: { ...prev.emailsUsage, limit: emailLimit },
      contactsUsage: { ...prev.contactsUsage, limit: contactLimit },
    }))

    showToast({
      type: 'success',
      title: 'Đã cập nhật gói cước',
      description: `Workspace đã được chuyển đổi sang ${planName}. Hạn ngạch mới đã áp dụng ngay lập tức.`,
    })
  }

  const handleSaveCard = async () => {
    setIsSavingCard(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsSavingCard(false)
    setBilling((prev) => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        holderName: cardHolder.toUpperCase(),
        last4: cardNumber.replace(/\s+/g, '').slice(-4) || '8899',
        expiry: cardExpiry,
      },
    }))
    setIsUpdateCardOpen(false)
    showToast({
      type: 'success',
      title: 'Đã cập nhật thẻ thanh toán',
      description: 'Phương thức thanh toán mới đã được xác thực an toàn.',
    })
  }

  const handleDownloadInvoice = (inv: InvoiceItem) => {
    showToast({
      type: 'info',
      title: `Đang tải hóa đơn ${inv.invoiceNumber}`,
      description: 'Tệp hóa đơn điện tử GTGT hợp lệ đang được tải xuống...',
    })
    setTimeout(() => {
      showToast({
        type: 'success',
        title: 'Tải hóa đơn hoàn tất',
        description: `Hóa đơn ${inv.invoiceNumber}.pdf đã được lưu về máy.`,
      })
    }, 800)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header with Upgrade Action */}
      <PageHeader
        title="Gói Cước, Thanh Toán & Hạn Ngạch (Billing & Usage)"
        description="Quản lý gói dịch vụ doanh nghiệp, theo dõi hạn ngạch email theo thời gian thực và tra cứu hóa đơn điện tử GTGT hợp pháp."
        actions={
          canManageBilling && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Crown className="w-4 h-4" />}
              onClick={() => setIsPlanModalOpen(true)}
            >
              Nâng Cấp Gói Dịch Vụ
            </Button>
          )
        }
      />

      {/* 2. Sub-navigation tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        {[
          { id: 'overview', label: 'Tổng Quan & Gói Cước', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'usage', label: 'Tình Trạng Hạn Ngạch (Usage)', icon: <Zap className="w-4 h-4" /> },
          { id: 'invoices', label: 'Lịch Sử Hóa Đơn (Invoices)', icon: <Receipt className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id as any)}
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

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-0">
          {/* Current Plan Card */}
          <CurrentPlanCard
            billing={billing}
            onManagePlan={() => setIsPlanModalOpen(true)}
          />

          {/* Quota Widget Quick Snapshot */}
          <UsageQuotaWidget
            emailsUsage={billing.emailsUsage}
            contactsUsage={billing.contactsUsage}
            onUpgradeClick={() => setIsPlanModalOpen(true)}
          />

          {/* Payment Method & Tax Info */}
          <PaymentMethodCard
            paymentMethod={billing.paymentMethod}
            billing={billing}
            onUpdatePayment={() => setIsUpdateCardOpen(true)}
          />
        </div>
      )}

      {/* ================= TAB 2: USAGE & LIMITS ================= */}
      {activeTab === 'usage' && (
        <div className="space-y-6 animate-in fade-in-0">
          <UsageQuotaWidget
            emailsUsage={billing.emailsUsage}
            contactsUsage={billing.contactsUsage}
            onUpgradeClick={() => setIsPlanModalOpen(true)}
          />

          {/* Infrastructure Quota Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm">Tài Nguyên Hạ Tầng Đã Được Cấp Phát</CardTitle>
            </CardHeader>

            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Dedicated IP Riêng Biệt</span>
                <div className="text-xl font-bold font-mono text-blue-600">1 IP Cố Định</div>
                <p className="text-[10px] text-emerald-600 font-medium">Đã Warmup 100% (Inbox Ready)</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Tốc Độ Phân Phối Tối Đa</span>
                <div className="text-xl font-bold font-mono text-emerald-600">10,000 email / phút</div>
                <p className="text-[10px] text-slate-400">Không bị nghẽn hàng đợi</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Số Lượng Tên Miền Gửi</span>
                <div className="text-xl font-bold font-mono text-violet-600">Không Giới Hạn</div>
                <p className="text-[10px] text-violet-600 font-medium">SPF/DKIM tự động hóa</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 3: INVOICES ================= */}
      {activeTab === 'invoices' && (
        <Card className="animate-in fade-in-0">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Lịch Sử Hóa Đơn & Chứng Từ VAT</CardTitle>
              <CardDescription className="text-xs">
                Tra cứu và tải về các hóa đơn điện tử hợp lệ phục vụ kê khai thuế doanh nghiệp.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <InvoiceTable
              invoices={invoices}
              onViewInvoice={(inv) => setViewingInvoice(inv)}
              onDownloadInvoice={handleDownloadInvoice}
            />
          </CardContent>
        </Card>
      )}

      {/* MODALS */}
      {/* 1. Plan Selector Dialog */}
      <PlanSelectorDialog
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        currentTier={billing.planTier}
        onSelectPlan={handleSelectPlan}
      />

      {/* 2. Update Payment Card Modal */}
      <Dialog open={isUpdateCardOpen} onOpenChange={() => setIsUpdateCardOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600">
              <CreditCard className="w-5 h-5" />
              <DialogTitle>Cập Nhật Thẻ Thanh Toán</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Nhập thông tin thẻ tín dụng/ghi nợ quốc tế mới để thanh toán tự động hàng tháng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <FormField>
              <FormLabel required>Tên Chủ Thẻ (In hoa không dấu)</FormLabel>
              <Input
                placeholder="NGUYEN VAN ADMIN"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                autoFocus
              />
            </FormField>

            <FormField>
              <FormLabel required>Số Thẻ Quốc Tế</FormLabel>
              <Input
                placeholder="4111 2222 3333 4444"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField>
                <FormLabel required>Hạn Thẻ (MM/YY)</FormLabel>
                <Input
                  placeholder="12/28"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                />
              </FormField>

              <FormField>
                <FormLabel required>Mã CVV/CVC</FormLabel>
                <Input type="password" placeholder="•••" maxLength={4} />
              </FormField>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsUpdateCardOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSavingCard}
              onClick={handleSaveCard}
            >
              Lưu Thẻ Mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. View Invoice Detail Modal */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Receipt className="w-5 h-5 text-blue-600" />
              <DialogTitle>Chi Tiết Hóa Đơn {viewingInvoice?.invoiceNumber}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nội dung:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[200px]">
                {viewingInvoice?.description}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ngày lập hóa đơn:</span>
              <span className="font-mono font-semibold">{viewingInvoice?.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Số tiền thanh toán:</span>
              <span className="font-mono font-extrabold text-blue-600 text-base">
                {viewingInvoice?.amount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="text-emerald-600 font-bold">ĐÃ THANH TOÁN (PAID)</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewingInvoice(null)}>
              Đóng
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {
                if (viewingInvoice) handleDownloadInvoice(viewingInvoice)
              }}
            >
              Tải Hóa Đơn VAT PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BillingPage
