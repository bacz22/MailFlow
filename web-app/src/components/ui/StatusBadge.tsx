import React from 'react'
import {
  FileEdit,
  Clock,
  Hourglass,
  CheckCircle2,
  Send,
  CheckCheck,
  PauseCircle,
  XCircle,
  AlertOctagon,
  Activity,
  CircleOff,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '../../utils/cn'

export type StatusType =
  | 'draft'
  | 'scheduled'
  | 'pending'
  | 'approved'
  | 'sending'
  | 'completed'
  | 'paused'
  | 'cancelled'
  | 'failed'
  | 'active'
  | 'inactive'
  | 'verified'
  | 'unverified'

export interface StatusConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}

export const STATUS_MAP: Record<StatusType, StatusConfig> = {
  draft: {
    label: 'Bản nháp',
    icon: FileEdit,
    className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  },
  scheduled: {
    label: 'Đã lên lịch',
    icon: Clock,
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },
  pending: {
    label: 'Chờ duyệt',
    icon: Hourglass,
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  approved: {
    label: 'Đã duyệt',
    icon: CheckCircle2,
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  },
  sending: {
    label: 'Đang gửi...',
    icon: Send,
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 animate-pulse',
  },
  completed: {
    label: 'Hoàn tất',
    icon: CheckCheck,
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  paused: {
    label: 'Tạm dừng',
    icon: PauseCircle,
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  },
  cancelled: {
    label: 'Đã hủy',
    icon: XCircle,
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
  failed: {
    label: 'Thất bại',
    icon: AlertOctagon,
    className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
  active: {
    label: 'Hoạt động',
    icon: Activity,
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  inactive: {
    label: 'Ngừng hoạt động',
    icon: CircleOff,
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
  verified: {
    label: 'Đã xác thực',
    icon: ShieldCheck,
    className: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  },
  unverified: {
    label: 'Chưa xác thực',
    icon: ShieldAlert,
    className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
}

export interface StatusBadgeProps {
  status: StatusType
  customLabel?: string
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const config = STATUS_MAP[status] || STATUS_MAP.draft
  const IconComponent = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        config.className,
        className
      )}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{customLabel || config.label}</span>
    </span>
  )
}
