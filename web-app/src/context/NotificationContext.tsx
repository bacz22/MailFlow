import React, { createContext, useContext, useState, useCallback } from 'react'
import type { AppNotification } from '../types/notification.types'

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'CAMPAIGN_APPROVAL_REQUIRED',
    title: 'Yêu Cầu Phê Duyệt Chiến Dịch Mới',
    description: 'Nguyễn Văn Editor vừa gửi chiến dịch "Bản Tin Công Nghệ & Khuyến Mãi Q3/2026" (45,200 người nhận) để phê duyệt.',
    createdAt: '27/08/2026 10:15',
    timeAgo: '5 phút trước',
    isRead: false,
    targetPath: '/campaigns/cmp-1',
    category: 'campaign',
  },
  {
    id: 'notif-2',
    type: 'USAGE_NEAR_LIMIT',
    title: 'Cảnh Báo Hạn Ngạch Email (72.5%)',
    description: 'Tổ chức của bạn đã sử dụng 72,500 / 100,000 email trong hạn ngạch tháng này. Hãy xem xét nâng cấp gói để tránh gián đoạn.',
    createdAt: '27/08/2026 09:30',
    timeAgo: '45 phút trước',
    isRead: false,
    targetPath: '/settings/billing/usage',
    category: 'billing',
  },
  {
    id: 'notif-3',
    type: 'DOMAIN_VERIFIED',
    title: 'Xác Thực Tên Miền Thành Công',
    description: 'Tên miền "mailflow.vn" đã hoàn tất đối soát bản ghi SPF & DKIM 2048-bit thành công 100%.',
    createdAt: '27/08/2026 08:00',
    timeAgo: '2 giờ trước',
    isRead: false,
    targetPath: '/settings/domains',
    category: 'system',
  },
  {
    id: 'notif-4',
    type: 'IMPORT_COMPLETED',
    title: 'Nhập Danh Bạ Hoàn Tất',
    description: 'Đã nhập thành công 14,200 liên hệ mới vào danh sách "VIP Enterprise Clients".',
    createdAt: '26/08/2026 16:45',
    timeAgo: 'Hôm qua',
    isRead: true,
    targetPath: '/contacts',
    category: 'audience',
  },
  {
    id: 'notif-5',
    type: 'CAMPAIGN_COMPLETED',
    title: 'Chiến Dịch Đã Gửi Thành Công',
    description: 'Chiến dịch "Flash Sale Cuối Tuần Dành Cho Khách VIP" đã hoàn tất phát hành 18,400 email (Tỷ lệ mở 52.4%).',
    createdAt: '24/08/2026 11:30',
    timeAgo: '3 ngày trước',
    isRead: true,
    targetPath: '/campaigns/cmp-2',
    category: 'campaign',
  },
  {
    id: 'notif-6',
    type: 'DOMAIN_VERIFICATION_FAILED',
    title: 'Bản Ghi DKIM Tên Miền Chưa Khớp',
    description: 'Bản ghi DKIM của tên miền "partner.mailflow.vn" chưa được tìm thấy trên nameserver công cộng.',
    createdAt: '23/08/2026 14:00',
    timeAgo: '4 ngày trước',
    isRead: true,
    targetPath: '/settings/domains',
    category: 'system',
  },
]

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
