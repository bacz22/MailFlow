import React, { useState, useRef, useEffect } from 'react'
import { Bell, ArrowRight } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { getNotificationMeta } from './NotificationItem'

export interface NotificationBellDropdownProps {
  onNavigate: (path: string) => void
}

export const NotificationBellDropdown: React.FC<NotificationBellDropdownProps> = ({ onNavigate }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    hasNewNotification,
    clearNewNotificationFlag,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Top 5 notifications for preview
  const recentNotifications = notifications.slice(0, 5)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (n: typeof notifications[0]) => {
    if (!n.isRead) markAsRead(n.id)
    setIsOpen(false)
    if (n.targetPath) onNavigate(n.targetPath)
  }

  const handleToggle = () => {
    if (!isOpen) {
      clearNewNotificationFlag()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        title="Thông báo hệ thống"
      >
        <Bell className={`w-5 h-5 ${hasNewNotification ? 'text-blue-600 dark:text-blue-400 animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {hasNewNotification && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Preview Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Thông Báo Gần Đây
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List of 5 Recent */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Không có thông báo nào.
              </div>
            ) : (
              recentNotifications.map((n) => {
                const meta = getNotificationMeta(n.type)
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3 px-4 transition flex items-start gap-3 cursor-pointer ${
                      !n.isRead
                        ? 'bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${meta.colorClasses}`}
                    >
                      {meta.icon}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            !n.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {n.timeAgo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {n.description}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer View All Link */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onNavigate('/notifications')
              }}
              className="w-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 py-1 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Xem Tất Cả Trong Notification Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBellDropdown
