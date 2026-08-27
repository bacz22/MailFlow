import React from 'react'
import {
  Clock,
  PauseCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileEdit,
  ShieldAlert,
} from 'lucide-react'
import type { CampaignStatus } from '../../types/campaign.types'

export interface CampaignStatusBadgeProps {
  status: CampaignStatus
}

export const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'SENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
          <span>Đang Gửi</span>
        </span>
      )
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>Đã Lên Lịch</span>
        </span>
      )
    case 'PENDING_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Chờ Phê Duyệt</span>
        </span>
      )
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã Duyệt</span>
        </span>
      )
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Hoàn Thành</span>
        </span>
      )
    case 'PAUSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
          <PauseCircle className="w-3.5 h-3.5" />
          <span>Tạm Dừng</span>
        </span>
      )
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <FileEdit className="w-3.5 h-3.5" />
          <span>Bản Nháp</span>
        </span>
      )
    case 'QUEUED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>Đang Xếp Hàng</span>
        </span>
      )
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold">
          <XCircle className="w-3.5 h-3.5" />
          <span>Từ Chối</span>
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <XCircle className="w-3.5 h-3.5" />
          <span>Đã Hủy</span>
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Thất Bại</span>
        </span>
      )
    default:
      return null
  }
}

export default CampaignStatusBadge
