import React, { useState } from 'react'
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'

export interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timeAgo: string
  read: boolean
  link?: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'success',
    title: 'Chiến dịch gửi hoàn tất',
    message: 'Chiến dịch "Khuyến Mãi Mùa Thu" đã gửi thành công tới 45,200 liên hệ (Open rate 72.4%).',
    timeAgo: '5 phút trước',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'warning',
    title: 'Cảnh báo giới hạn gửi',
    message: 'Bạn đã sử dụng 85% hạn ngạch email tháng này. Nâng cấp gói để tránh gián đoạn.',
    timeAgo: '1 giờ trước',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'info',
    title: 'Xác thực tên miền hoàn tất',
    message: 'Tên miền marketing.techcorp.vn đã được ký DKIM và SPF hợp lệ.',
    timeAgo: '3 giờ trước',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'error',
    title: 'SMTP Timeout trên server backup',
    message: 'Máy chủ SES backup bị ngắt kết nối tạm thời lúc 02:15 AM.',
    timeAgo: '1 ngày trước',
    read: true,
  },
]

export interface NotificationMenuProps {
  className?: string
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ className }) => {
  const { showToast } = useToast()
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read
    return true
  })

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
    showToast({
      type: 'info',
      title: 'Thông báo',
      description: 'Đã đánh dấu tất cả thông báo là đã đọc.',
    })
  }

  const markItemAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />
    }
  }

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30',
            className
          )}
          aria-label={`Thông báo (${unreadCount} chưa đọc)`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 text-slate-900 dark:text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">Thông Báo</span>
              {unreadCount > 0 && (
                <Badge size="sm" variant="danger" className="text-[10px] px-1.5 py-0 h-4">
                  {unreadCount} mới
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition cursor-pointer',
                activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition cursor-pointer',
                activeFilter === 'unread'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar-thin">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markItemAsRead(n.id)}
                className={cn(
                  'p-3 flex items-start gap-3 transition-colors cursor-pointer text-left select-none',
                  !n.read
                    ? 'bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-50/70 dark:hover:bg-blue-950/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <div className="mt-0.5">{getIcon(n.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={cn('text-xs truncate font-bold', !n.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300')}>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{n.timeAgo}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {n.message}
                  </p>
                </div>

                {!n.read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5" />
                )}
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Không có thông báo nào
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                showToast({ type: 'info', title: 'Trung tâm thông báo', description: 'Xem toàn bộ lịch sử thông báo' })
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Xem tất cả trong Trung Tâm Thông Báo
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export default NotificationMenu
