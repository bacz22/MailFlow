import React from 'react'
import { Receipt, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  period: string
  amount: string
  date: string
  status: 'paid' | 'pending'
}

export interface RecentInvoicesCardProps {
  invoices?: InvoiceItem[]
  className?: string
}

export const RecentInvoicesCard: React.FC<RecentInvoicesCardProps> = ({
  invoices,
  className,
}) => {
  const { showToast } = useToast()

  const defaultInvoices: InvoiceItem[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-08',
      period: 'Gói Enterprise (Tháng 08/2026)',
      amount: '$199.00',
      date: '01/08/2026',
      status: 'paid',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-07',
      period: 'Gói Enterprise (Tháng 07/2026)',
      amount: '$199.00',
      date: '01/07/2026',
      status: 'paid',
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-06',
      period: 'Gói Pro (Tháng 06/2026)',
      amount: '$79.00',
      date: '01/06/2026',
      status: 'paid',
    },
  ]

  const items = invoices || defaultInvoices

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base">Lịch Sử Hóa Đơn (Recent Invoices)</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((inv) => (
          <div
            key={inv.id}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {inv.invoiceNumber}
                </span>
                <Badge variant="success" className="text-[10px] py-0 px-1.5">
                  Đã thanh toán
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400">
                {inv.period} • {inv.date}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                {inv.amount}
              </span>
              <button
                type="button"
                onClick={() =>
                  showToast({
                    type: 'success',
                    title: 'Tải hóa đơn',
                    description: `Đang xuất hóa đơn ${inv.invoiceNumber} dạng PDF...`,
                  })
                }
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tải PDF"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default RecentInvoicesCard
