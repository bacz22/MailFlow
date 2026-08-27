import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  FileCheck,
  Globe,
  Zap,
  Check,
  ExternalLink,
} from 'lucide-react'
import type { AppNotification, NotificationType } from '../../types/notification.types'

export interface NotificationItemProps {
  notification: AppNotification
  onNavigate: (path: string) => void
  onMarkAsRead: (id: string) => void
}

export function getNotificationMeta(type: NotificationType): {
  icon: React.ReactNode
  colorClasses: string
} {
  switch (type) {
    case 'CAMPAIGN_COMPLETED':
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        colorClasses: 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800',
      }
    case 'CAMPAIGN_FAILED':
      return {
        icon: <XCircle className="w-4 h-4 text-rose-600" />,
        colorClasses: 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800',
      }
    case 'CAMPAIGN_APPROVAL_REQUIRED':
      return {
        icon: <Clock className="w-4 h-4 text-amber-600" />,
        colorClasses: 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800',
      }
    case 'CAMPAIGN_REJECTED':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        colorClasses: 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800',
      }
    case 'IMPORT_COMPLETED':
      return {
        icon: <FileCheck className="w-4 h-4 text-blue-600" />,
        colorClasses: 'bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800',
      }
    case 'IMPORT_FAILED':
      return {
        icon: <XCircle className="w-4 h-4 text-rose-600" />,
        colorClasses: 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800',
      }
    case 'DOMAIN_VERIFIED':
      return {
        icon: <Globe className="w-4 h-4 text-emerald-600" />,
        colorClasses: 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800',
      }
    case 'DOMAIN_VERIFICATION_FAILED':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        colorClasses: 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800',
      }
    case 'USAGE_NEAR_LIMIT':
      return {
        icon: <Zap className="w-4 h-4 text-amber-600" />,
        colorClasses: 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800',
      }
    default:
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
        colorClasses: 'bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800',
      }
  }
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onNavigate,
  onMarkAsRead,
}) => {
  const meta = getNotificationMeta(notification.type)

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.targetPath) {
      onNavigate(notification.targetPath)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer relative group ${
        !notification.isRead
          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Type Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.colorClasses}`}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4
              className={`text-xs font-bold truncate ${
                !notification.isRead
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Chưa đọc" />
            )}
          </div>

          <span className="font-mono text-[10px] text-slate-400 shrink-0">
            {notification.timeAgo}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
          {notification.description}
        </p>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline flex items-center gap-1">
            <span>Xem chi tiết</span>
            <ExternalLink className="w-3 h-3" />
          </span>

          {!notification.isRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Đánh dấu đã đọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationItem
