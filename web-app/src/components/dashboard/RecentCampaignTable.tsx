import React from 'react'
import { Send, Eye, ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { Button } from '../ui/Button'
import type { StatusType } from '../ui/StatusBadge'

export interface CampaignItem {
  id: string
  name: string
  subject: string
  status: StatusType
  recipients: number
  openRate: string
  clickRate: string
  sentAt: string
}

export interface RecentCampaignTableProps {
  campaigns?: CampaignItem[]
  onViewAll?: () => void
  onSelectCampaign?: (id: string) => void
  className?: string
}

export const RecentCampaignTable: React.FC<RecentCampaignTableProps> = ({
  campaigns,
  onViewAll,
  onSelectCampaign,
  className,
}) => {
  const defaultCampaigns: CampaignItem[] = [
    {
      id: 'c-1',
      name: 'Product Launch 2.0 - Early Bird Access',
      subject: '🚀 Ra mắt MailFlow 2.0: Trải nghiệm email marketing đỉnh cao',
      status: 'sending',
      recipients: 14250,
      openRate: '72.4%',
      clickRate: '28.1%',
      sentAt: 'Vừa xong (10:15)',
    },
    {
      id: 'c-2',
      name: 'Weekly Newsletter #48 - AI Automation',
      subject: 'Bản tin hàng tuần: 5 mẹo tối ưu Inbox Rate với RFC 8058',
      status: 'completed',
      recipients: 8900,
      openRate: '68.5%',
      clickRate: '24.3%',
      sentAt: 'Hôm qua, 14:00',
    },
    {
      id: 'c-3',
      name: 'Black Friday VIP Discount Promo',
      subject: 'Ưu đãi độc quyền giảm 30% cho khách hàng thân thiết',
      status: 'scheduled',
      recipients: 24500,
      openRate: '-',
      clickRate: '-',
      sentAt: '28/08 lúc 09:00',
    },
    {
      id: 'c-4',
      name: 'Customer Re-engagement Sequence',
      subject: 'Chúng tôi rất nhớ bạn! Nhận ngay 10,000 email miễn phí',
      status: 'draft',
      recipients: 3200,
      openRate: '-',
      clickRate: '-',
      sentAt: 'Lưu nháp 2 ngày trước',
    },
  ]

  const items = campaigns || defaultCampaigns

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base">Chiến Dịch Gần Đây (Recent Campaigns)</CardTitle>
          </div>
          <CardDescription className="text-xs">Theo dõi tiến độ phân phối và tương tác trực tiếp</CardDescription>
        </div>

        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <span>Xem tất cả</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Tên Chiến Dịch & Tiêu Đề</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Người Nhận</th>
                <th className="py-2.5 px-3 text-right">Tỷ Lệ Mở</th>
                <th className="py-2.5 px-3 text-right">Nhấp (CTR)</th>
                <th className="py-2.5 px-3">Thời Gian Gửi</th>
                <th className="py-2.5 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition cursor-pointer"
                  onClick={() => onSelectCampaign?.(c.id)}
                >
                  {/* Campaign Name */}
                  <td className="py-3 px-4 max-w-xs sm:max-w-md">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {c.subject}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={c.status} size="sm" />
                  </td>

                  {/* Recipients */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    {c.recipients.toLocaleString()}
                  </td>

                  {/* Open Rate */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {c.openRate}
                  </td>

                  {/* CTR */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    {c.clickRate}
                  </td>

                  {/* Sent Time */}
                  <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                    {c.sentAt}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentCampaignTable
