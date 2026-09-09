import React, { useState } from 'react'
import {
  Bell,
  CheckCheck,
  Search,
  Mail,
  Users,
  Zap,
  Globe,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { NotificationItem } from '../components/notifications/NotificationItem'
import { useNotifications } from '../context/NotificationContext'
import { useToast } from '../components/ui/Toast'

export interface NotificationsPageProps {
  onNavigate: (path: string) => void
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { showToast } = useToast()

  const [activeCategory, setActiveCategory] = useState<'all' | 'unread' | 'campaign' | 'audience' | 'system' | 'billing'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter logic
  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === 'unread' && n.isRead) return false
    if (activeCategory === 'campaign' && n.category !== 'campaign') return false
    if (activeCategory === 'audience' && n.category !== 'audience') return false
    if (activeCategory === 'system' && n.category !== 'system') return false
    if (activeCategory === 'billing' && n.category !== 'billing') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!n.title.toLowerCase().includes(q) && !n.description.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  const handleMarkAllRead = () => {
    markAllAsRead()
    showToast({
      type: 'success',
      title: 'Đã đánh dấu tất cả đã đọc',
      description: 'Mọi thông báo trong danh sách đã được chuyển về trạng thái đã đọc.',
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header with Mark All Read action */}
      <PageHeader
        title="Trung Tâm Thông Báo (Notification Center)"
        description="Theo dõi cập nhật trạng thái chiến dịch, yêu cầu kiểm duyệt, cảnh báo hạn ngạch và kết quả xác thực tên miền theo thời gian thực."
        actions={
          unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={handleMarkAllRead}
            >
              Đánh Dấu Tất Cả Đã Đọc ({unreadCount})
            </Button>
          )
        }
      />

      {/* 2. Filter tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex-wrap">
          {[
            { id: 'all', label: 'Tất Cả', count: notifications.length },
            { id: 'unread', label: 'Chưa Đọc', count: unreadCount },
            { id: 'campaign', label: 'Chiến Dịch', icon: <Mail className="w-3.5 h-3.5" /> },
            { id: 'audience', label: 'Danh Bạ', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'system', label: 'Hệ Thống & DNS', icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'billing', label: 'Hạn Ngạch & Gói', icon: <Zap className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeCategory === tab.id
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Tìm thông báo..."
            leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-600 dark:text-slate-400 text-sm">
              Không có thông báo nào
            </div>
            <p className="text-[11px]">
              {searchQuery
                ? 'Không tìm thấy thông báo khớp với từ khóa tìm kiếm.'
                : 'Mọi thông báo mới về chiến dịch và hệ thống sẽ xuất hiện tại đây.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onNavigate={onNavigate}
              onMarkAsRead={markAsRead}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
