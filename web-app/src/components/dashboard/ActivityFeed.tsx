import React from 'react'
import { Activity, Send, UserPlus, Globe, CreditCard } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

export interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
  iconBg: string
}

export interface ActivityFeedProps {
  items?: ActivityItem[]
  className?: string
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, className }) => {
  const defaultActivities: ActivityItem[] = [
    {
      id: 'a-1',
      title: 'Chiến dịch đã gửi thành công',
      description: 'Chiến dịch "Product Launch 2.0" đã hoàn tất gửi 14,250 emails.',
      timestamp: '10 phút trước',
      icon: <Send className="w-3.5 h-3.5" />,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'a-2',
      title: 'Đã xác thực tên miền DNS',
      description: 'Bản ghi DKIM & DMARC cho domain marketing.company.com đã hợp lệ.',
      timestamp: '1 giờ trước',
      icon: <Globe className="w-3.5 h-3.5" />,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'a-3',
      title: 'Thành viên mới gia nhập',
      description: 'Trần Minh Anh vừa chấp nhận lời mời với vai trò Campaign Editor.',
      timestamp: '3 giờ trước',
      icon: <UserPlus className="w-3.5 h-3.5" />,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'a-4',
      title: 'Hóa đơn chu kỳ mới',
      description: 'Đã thanh toán gói Enterprise Plan (500k emails/tháng).',
      timestamp: 'Hôm qua',
      icon: <CreditCard className="w-3.5 h-3.5" />,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ]

  const feed = items || defaultActivities

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base">Hoạt Động Gần Đây (Activity Feed)</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {feed.map((act) => (
            <div key={act.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-xs ${act.iconBg}`}
              >
                {act.icon}
              </div>

              {/* Text */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {act.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ActivityFeed
