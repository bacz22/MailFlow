import React, { useState } from 'react'
import {
  Download,
  Search,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import type {
  CampaignAnalyticsRow,
  DailyPerformancePoint,
} from '../types/analytics.types'

const MOCK_CAMPAIGNS_PERFORMANCE: CampaignAnalyticsRow[] = [
  {
    id: 'cmp-1',
    name: 'Bản Tin Công Nghệ & Khuyến Mãi Q3/2026',
    sentAt: '27/08/2026',
    recipientsSent: 45200,
    deliveryRate: 99.82,
    openRate: 48.6,
    clickRate: 16.4,
    bounceRate: 0.18,
    unsubscribeRate: 0.03,
  },
  {
    id: 'cmp-2',
    name: 'Flash Sale Cuối Tuần Dành Cho Khách VIP',
    sentAt: '24/08/2026',
    recipientsSent: 18400,
    deliveryRate: 99.91,
    openRate: 52.4,
    clickRate: 21.8,
    bounceRate: 0.09,
    unsubscribeRate: 0.02,
  },
  {
    id: 'cmp-3',
    name: 'Chuỗi Email Onboarding Tự Động (14 Ngày)',
    sentAt: '20/08/2026',
    recipientsSent: 8900,
    deliveryRate: 99.65,
    openRate: 44.2,
    clickRate: 14.1,
    bounceRate: 0.35,
    unsubscribeRate: 0.06,
  },
  {
    id: 'cmp-4',
    name: 'Khảo Sát Ý Kiến Khách Hàng Doanh Nghiệp',
    sentAt: '15/08/2026',
    recipientsSent: 12500,
    deliveryRate: 99.78,
    openRate: 41.5,
    clickRate: 12.8,
    bounceRate: 0.22,
    unsubscribeRate: 0.04,
  },
  {
    id: 'cmp-5',
    name: 'Thông Báo Bảo Trì Hạ Tầng Dedicated IP',
    sentAt: '10/08/2026',
    recipientsSent: 34000,
    deliveryRate: 99.95,
    openRate: 64.2,
    clickRate: 18.9,
    bounceRate: 0.05,
    unsubscribeRate: 0.01,
  },
]

const DAILY_TRENDS: DailyPerformancePoint[] = [
  { date: '21/08', sent: 24000, opened: 11200, clicked: 3800 },
  { date: '22/08', sent: 18000, opened: 8900, clicked: 3100 },
  { date: '23/08', sent: 32000, opened: 15400, clicked: 5200 },
  { date: '24/08', sent: 48000, opened: 24100, clicked: 8900 },
  { date: '25/08', sent: 29000, opened: 13800, clicked: 4600 },
  { date: '26/08', sent: 41000, opened: 19800, clicked: 6700 },
  { date: '27/08', sent: 45200, opened: 21960, clicked: 7410 },
]

export interface AnalyticsPageProps {
  onNavigate: (path: string) => void
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const canExport = hasPermission(PERMISSIONS.ANALYTICS_EXPORT)

  // Filtered rows
  const filteredCampaigns = MOCK_CAMPAIGNS_PERFORMANCE.filter((c) => {
    if (selectedCampaignFilter !== 'all' && c.id !== selectedCampaignFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!c.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Export report handler
  const handleExport = (format: 'CSV' | 'PDF') => {
    showToast({
      type: 'info',
      title: `Đang xuất báo cáo ${format}`,
      description: 'Hệ thống đang chuẩn bị tệp dữ liệu phân tích chỉ số...',
    })
    setTimeout(() => {
      showToast({
        type: 'success',
        title: `Xuất tệp ${format} thành công`,
        description: `Báo cáo MailFlow_Analytics_${dateRange}.${format.toLowerCase()} đã sẵn sàng tải xuống.`,
      })
    }, 1000)
  }

  // Max value for bar scaling
  const maxSentInDay = Math.max(...DAILY_TRENDS.map((d) => d.sent))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header with Export Actions */}
      <PageHeader
        title="Báo Cáo & Phân Tích Hiệu Suất (Analytics Dashboard)"
        description="Tổng quan chỉ số gửi thư, tỷ lệ mở hộp thư, tỷ lệ click chuyển đổi (CTR) và tình trạng uy tín tên miền theo thời gian thực."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canExport && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleExport('CSV')}
                >
                  Xuất CSV
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleExport('PDF')}
                >
                  Xuất PDF
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* 2. TOP FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Date Range Selector */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold self-start">
          <button
            type="button"
            onClick={() => setDateRange('7d')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              dateRange === '7d'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            7 Ngày Qua
          </button>
          <button
            type="button"
            onClick={() => setDateRange('30d')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              dateRange === '30d'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            30 Ngày Qua
          </button>
          <button
            type="button"
            onClick={() => setDateRange('90d')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              dateRange === '90d'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            90 Ngày Qua
          </button>
        </div>

        {/* Campaign & Audience Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedCampaignFilter}
            onChange={(e) => setSelectedCampaignFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus-ring cursor-pointer"
          >
            <option value="all">Tất cả chiến dịch</option>
            {MOCK_CAMPAIGNS_PERFORMANCE.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            defaultValue="all"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus-ring cursor-pointer"
          >
            <option value="all">Tất cả đối tượng (Lists / Segments)</option>
            <option value="lst-1">VIP Enterprise Clients</option>
            <option value="lst-2">Webinar Leads Q3</option>
            <option value="seg-1">Phân Đoạn VIP Hà Nội</option>
          </select>
        </div>
      </div>

      {/* 3. CORE KPI METRICS GRID WITH INFORMATIVE TOOLTIPS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            key: 'sent',
            label: 'Tổng Email Đã Gửi',
            value: '237,500',
            change: '+14.2%',
            trend: 'up',
            benchmark: 'Mục tiêu: 200,000/tháng',
            tooltip: 'Tổng số email đã được phát hành qua các cụm máy chủ Dedicated IP.',
          },
          {
            key: 'delivery',
            label: 'Tỷ Lệ Giao Thành Công',
            value: '99.82%',
            change: '+0.1%',
            trend: 'up',
            benchmark: 'Chuẩn ngành: >98%',
            tooltip: 'Tỷ lệ email được hòm thư đích (Gmail, Outlook, Yahoo) chấp nhận vào Inbox.',
          },
          {
            key: 'open',
            label: 'Tỷ Lệ Mở (Open Rate)',
            value: '48.6%',
            change: '+3.4%',
            trend: 'up',
            benchmark: 'Top 5% ngành B2B SaaS',
            tooltip: 'Tỷ lệ người nhận mở thư ít nhất một lần dựa trên tracking pixel an toàn.',
          },
          {
            key: 'click',
            label: 'Tỷ Lệ Click (CTR)',
            value: '16.4%',
            change: '+1.8%',
            trend: 'up',
            benchmark: 'Trung bình ngành: 8 - 12%',
            tooltip: 'Tỷ lệ người nhận nhấp vào ít nhất một liên kết điều hướng trong nội dung thư.',
          },
          {
            key: 'bounce',
            label: 'Tỷ Lệ Lỗi (Bounce Rate)',
            value: '0.18%',
            change: '-0.05%',
            trend: 'down',
            benchmark: 'Cảnh báo nếu >2%',
            tooltip: 'Tỷ lệ email không thể gửi đến do hòm thư không tồn tại (Hard) hoặc hộp thư đầy (Soft).',
          },
          {
            key: 'unsub',
            label: 'Tỷ Lệ Hủy Tin',
            value: '0.04%',
            change: '0.00%',
            trend: 'neutral',
            benchmark: 'Tuân thủ RFC 8058',
            tooltip: 'Tỷ lệ người nhận sử dụng tính năng 1-click List-Unsubscribe.',
          },
        ].map((metric) => (
          <div
            key={metric.key}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative space-y-2 group"
            onMouseEnter={() => setActiveTooltip(metric.key)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                {metric.label}
              </span>
              <HelpCircle className="w-3 h-3 text-slate-300 group-hover:text-slate-500 cursor-pointer transition shrink-0" />
            </div>

            {/* Tooltip Overlay */}
            {activeTooltip === metric.key && (
              <div className="absolute -top-12 left-2 right-2 bg-slate-900 text-white text-[10px] p-2 rounded-xl shadow-xl z-20 pointer-events-none leading-tight border border-slate-700 animate-in fade-in-0">
                {metric.tooltip}
              </div>
            )}

            <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {metric.value}
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span
                className={`font-mono font-bold ${
                  metric.trend === 'up'
                    ? 'text-emerald-600'
                    : metric.trend === 'down'
                    ? 'text-blue-600'
                    : 'text-slate-400'
                }`}
              >
                {metric.change}
              </span>
              <span className="text-slate-400 truncate max-w-[90px]">{metric.benchmark}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. PERFORMANCE CHARTS: OVER TIME & DELIVERY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Performance Over Time (8 Cols) */}
        <Card className="lg:col-span-8">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Xu Hướng Tương Tác Email Theo Ngày</CardTitle>
              <CardDescription className="text-xs">
                Biểu đồ so sánh lượng email đã gửi, lượng mở và lượng nhấp liên kết.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600 dark:text-slate-300">Đã Gửi</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Đã Mở</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-slate-600 dark:text-slate-300">Nhấp Link (CTR)</span>
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Daily Bars Visualizer */}
              <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 px-2">
                {DAILY_TRENDS.map((day) => {
                  const sentHeight = (day.sent / maxSentInDay) * 100
                  const openHeight = (day.opened / maxSentInDay) * 100
                  const clickHeight = (day.clicked / maxSentInDay) * 100

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        {/* Sent Bar */}
                        <div
                          style={{ height: `${sentHeight}%` }}
                          className="w-3 sm:w-4 bg-blue-600/80 group-hover:bg-blue-600 rounded-t transition-all relative"
                          title={`Đã gửi: ${day.sent.toLocaleString()}`}
                        />
                        {/* Open Bar */}
                        <div
                          style={{ height: `${openHeight}%` }}
                          className="w-3 sm:w-4 bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t transition-all"
                          title={`Đã mở: ${day.opened.toLocaleString()}`}
                        />
                        {/* Click Bar */}
                        <div
                          style={{ height: `${clickHeight}%` }}
                          className="w-2 sm:w-3 bg-violet-500/80 group-hover:bg-violet-500 rounded-t transition-all"
                          title={`Đã click: ${day.clicked.toLocaleString()}`}
                        />
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                        {day.date}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Delivery Quality Breakdown (4 Cols) */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base">Chất Lượng Phân Phối</CardTitle>
            <CardDescription className="text-xs">
              Tỷ lệ Inbox thành công và phân loại lỗi giao thư.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {/* Primary Delivery Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Chấp Nhận Vào Inbox</span>
                </span>
                <span className="font-mono text-emerald-600 text-sm">99.82%</span>
              </div>
              <div className="w-full bg-emerald-200 dark:bg-emerald-900 h-2 rounded-full overflow-hidden">
                <div style={{ width: '99.82%' }} className="h-full bg-emerald-600 rounded-full" />
              </div>
            </div>

            {/* Error Breakdown Items */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Lỗi Tạm Thời (Soft Bounce)</span>
                <span className="font-mono font-bold text-amber-600">0.12% (284 email)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Lỗi Vĩnh Viễn (Hard Bounce)</span>
                <span className="font-mono font-bold text-rose-600">0.06% (142 email)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Báo Cáo Spam (FBL)</span>
                <span className="font-mono font-bold text-emerald-600">&lt; 0.01% (0 email)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-[11px] text-blue-800 dark:text-blue-300">
              💡 Uy tín tên miền gửi (Sender Reputation) đang đạt mức <strong>Tối Ưu (Optimal - 99/100)</strong>.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. TOP CAMPAIGNS PERFORMANCE TABLE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Hiệu Suất Chi Tiết Từng Chiến Dịch</CardTitle>
            <CardDescription className="text-xs">
              Bảng so sánh chi tiết các chỉ số Delivered, Open, Click (CTR) và Bounces.
            </CardDescription>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Tìm theo tên chiến dịch..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Không tìm thấy chiến dịch nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Chiến Dịch</th>
                  <th className="py-3 px-4">Ngày Gửi</th>
                  <th className="py-3 px-4 text-right">Đã Gửi</th>
                  <th className="py-3 px-4 text-right">Delivered</th>
                  <th className="py-3 px-4 text-right">Open Rate</th>
                  <th className="py-3 px-4 text-right">Click (CTR)</th>
                  <th className="py-3 px-4 text-right">Bounces</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCampaigns.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onNavigate(`/campaigns/${row.id}`)}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{row.sentAt}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.recipientsSent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                      {row.deliveryRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-600 font-bold">
                      {row.openRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-violet-600 font-bold">
                      {row.clickRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {row.bounceRate}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-blue-600 hover:text-blue-700"
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigate(`/campaigns/${row.id}`)
                        }}
                      >
                        Báo Cáo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsPage
