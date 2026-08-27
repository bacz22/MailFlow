import React from 'react'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import type { SenderVerificationStatus } from '../../types/sender.types'

export interface SenderStatusBadgeProps {
  status: SenderVerificationStatus
}

export const SenderStatusBadge: React.FC<SenderStatusBadgeProps> = ({ status }) => {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900 select-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Đã Xác Minh (Verified)</span>
      </span>
    )
  }

  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900 select-none">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>Chờ Xác Thực Email</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 select-none">
      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
      <span>Xác Minh Thất Bại</span>
    </span>
  )
}

export default SenderStatusBadge
