import React from 'react'
import { CheckCircle2, UserX, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react'
import type { ContactStatus } from '../../types/contact.types'
import { cn } from '../../utils/cn'

export interface ContactStatusBadgeProps {
  status: ContactStatus
  size?: 'sm' | 'md'
  className?: string
}

export const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const configMap: Record<
    ContactStatus,
    { label: string; icon: React.ReactNode; styles: string }
  > = {
    active: {
      label: 'Hoạt động',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
      styles:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    },
    unsubscribed: {
      label: 'Hủy đăng ký',
      icon: <UserX className="w-3 h-3 text-slate-500 dark:text-slate-400" />,
      styles:
        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    },
    bounced: {
      label: 'Bounced',
      icon: <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
      styles:
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    },
    invalid: {
      label: 'Không hợp lệ',
      icon: <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
      styles:
        'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    },
    blocked: {
      label: 'Đã chặn',
      icon: <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
      styles:
        'bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/30',
    },
  }

  const conf = configMap[status] || configMap.active

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        conf.styles,
        className
      )}
    >
      {conf.icon}
      <span>{conf.label}</span>
    </span>
  )
}

export default ContactStatusBadge
