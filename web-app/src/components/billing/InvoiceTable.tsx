import React from 'react'
import {
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
} from 'lucide-react'
import { Button } from '../ui/Button'
import type { InvoiceItem } from '../../types/billing.types'

export interface InvoiceTableProps {
  invoices: InvoiceItem[]
  onViewInvoice: (invoice: InvoiceItem) => void
  onDownloadInvoice: (invoice: InvoiceItem) => void
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onViewInvoice,
  onDownloadInvoice,
}) => {
  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Chưa có hóa đơn nào phát sinh trong lịch sử thanh toán.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">Mã Hóa Đơn</th>
            <th className="py-3 px-4">Nội Dung Thanh Toán</th>
            <th className="py-3 px-4">Ngày Lập</th>
            <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
            <th className="py-3 px-4 text-center">Trạng Thái</th>
            <th className="py-3 px-4 text-center">Chứng Từ VAT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
              {/* Invoice Number */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                  <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{inv.invoiceNumber}</span>
                </div>
              </td>

              {/* Description */}
              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                {inv.description}
              </td>

              {/* Date */}
              <td className="py-3 px-4 font-mono text-slate-500">{inv.date}</td>

              {/* Amount */}
              <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                {inv.amount}
              </td>

              {/* Status */}
              <td className="py-3 px-4 text-center">
                {inv.status === 'PAID' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã Thanh Toán</span>
                  </span>
                ) : inv.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Chờ Xử Lý</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px] px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Thất Bại</span>
                  </span>
                )}
              </td>

              {/* Action Buttons */}
              <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-blue-600 text-xs"
                    leftIcon={<Eye className="w-3 h-3" />}
                    onClick={() => onViewInvoice(inv)}
                    title="Xem chi tiết hóa đơn"
                  >
                    Xem
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-slate-600 dark:text-slate-300 text-xs"
                    leftIcon={<Download className="w-3 h-3" />}
                    onClick={() => onDownloadInvoice(inv)}
                    title="Tải hóa đơn điện tử VAT PDF"
                  >
                    PDF
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InvoiceTable
