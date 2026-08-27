import React, { useState } from 'react'
import {
  ArrowLeft,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'

export interface CampaignReportPageProps {
  campaignId: string
  onNavigate: (path: string) => void
}

interface RecipientReportRow {
  id: string
  name: string
  email: string
  company: string
  deliveryStatus: 'DELIVERED' | 'BOUNCED' | 'SOFT_BOUNCE'
  hasOpened: boolean
  hasClicked: boolean
  lastEvent: string
  lastEventTime: string
}

const MOCK_RECIPIENTS_LOG: RecipientReportRow[] = [
  {
    id: 'rcp-1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@vcorp.vn',
    company: 'V-Corp Global',
    deliveryStatus: 'DELIVERED',
    hasOpened: true,
    hasClicked: true,
    lastEvent: 'Clicked link "Xem Chi Tiết Ngay"',
    lastEventTime: '27/08/2026 09:42',
  },
  {
    id: 'rcp-2',
    name: 'Phạm Thu Hương',
    email: 'huong.pham@fintech.asia',
    company: 'Fintech Asia Hub',
    deliveryStatus: 'DELIVERED',
    hasOpened: true,
    hasClicked: true,
    lastEvent: 'Clicked link "Xem Chi Tiết Ngay"',
    lastEventTime: '27/08/2026 09:35',
  },
  {
    id: 'rcp-3',
    name: 'Trần Minh Tuấn',
    email: 'tuan.tran@techlead.io',
    company: 'TechLead Solutions',
    deliveryStatus: 'DELIVERED',
    hasOpened: true,
    hasClicked: false,
    lastEvent: 'Opened email in Apple Mail',
    lastEventTime: '27/08/2026 09:12',
  },
  {
    id: 'rcp-4',
    name: 'Lê Hoàng Nam',
    email: 'nam.le@vietnam-retail.com',
    company: 'Vietnam Retail Co.',
    deliveryStatus: 'DELIVERED',
    hasOpened: false,
    hasClicked: false,
    lastEvent: 'Delivered to Gmail MX Server',
    lastEventTime: '27/08/2026 09:00',
  },
  {
    id: 'rcp-5',
    name: 'Đặng Mai Phương',
    email: 'phuong.dang@invalid-domain-test.vn',
    company: 'Phương Nam Media',
    deliveryStatus: 'BOUNCED',
    hasOpened: false,
    hasClicked: false,
    lastEvent: 'Hard bounce: 550 Mailbox unavailable',
    lastEventTime: '27/08/2026 09:01',
  },
  {
    id: 'rcp-6',
    name: 'Hoàng Quốc Bảo',
    email: 'bao.hoang@full-mailbox.com',
    company: 'Bảo Tín Tech',
    deliveryStatus: 'SOFT_BOUNCE',
    hasOpened: false,
    hasClicked: false,
    lastEvent: 'Soft bounce: 452 Mailbox quota exceeded',
    lastEventTime: '27/08/2026 09:02',
  },
]

const HOURLY_TIMELINE = [
  { hour: '09:00', sent: 45200, opened: 6800, clicked: 2100 },
  { hour: '10:00', sent: 0, opened: 12400, clicked: 4200 },
  { hour: '11:00', sent: 0, opened: 16800, clicked: 5800 },
  { hour: '12:00', sent: 0, opened: 19200, clicked: 6600 },
  { hour: '14:00', sent: 0, opened: 21100, clicked: 7100 },
  { hour: '16:00', sent: 0, opened: 21967, clicked: 7412 },
]

export const CampaignReportPage: React.FC<CampaignReportPageProps> = ({
  campaignId,
  onNavigate,
}) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()
  const canExport = hasPermission(PERMISSIONS.ANALYTICS_EXPORT)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'DELIVERED' | 'BOUNCED' | 'SOFT_BOUNCE'>('all')
  const [openFilter, setOpenFilter] = useState<'all' | 'opened' | 'not_opened'>('all')
  const [clickFilter, setClickFilter] = useState<'all' | 'clicked' | 'not_clicked'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filtered rows
  const filteredRecipients = MOCK_RECIPIENTS_LOG.filter((r) => {
    if (statusFilter !== 'all' && r.deliveryStatus !== statusFilter) return false
    if (openFilter === 'opened' && !r.hasOpened) return false
    if (openFilter === 'not_opened' && r.hasOpened) return false
    if (clickFilter === 'clicked' && !r.hasClicked) return false
    if (clickFilter === 'not_clicked' && r.hasClicked) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !r.name.toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q) &&
        !r.company.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return true
  })

  const handleExport = (format: 'CSV' | 'PDF') => {
    showToast({
      type: 'info',
      title: `Đang xuất báo cáo ${format}`,
      description: 'Đang kết xuất dữ liệu chi tiết từng người nhận...',
    })
    setTimeout(() => {
      showToast({
        type: 'success',
        title: `Đã xuất ${format} thành công`,
        description: `Báo cáo chi tiết chiến dịch #${campaignId} đã được tạo thành công.`,
      })
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate(`/campaigns/${campaignId}`)}
          >
            Quay Lại Chi Tiết Chiến Dịch
          </Button>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Báo Cáo Hiệu Suất Chiến Dịch
            </h1>
            <Badge variant="default" className="text-xs font-mono font-bold bg-blue-600">
              ID: {campaignId}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Chiến dịch: <strong className="text-slate-700 dark:text-slate-200">Bản Tin Công Nghệ & Khuyến Mãi Q3/2026</strong></span>
            <span>• Ngày phát hành: <span className="font-mono text-slate-600 dark:text-slate-300">27/08/2026 09:00</span></span>
          </div>
        </div>

        {/* Export action */}
        {canExport && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => handleExport('CSV')}
            >
              Xuất CSV Người Nhận
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => handleExport('PDF')}
            >
              Xuất Bản PDF
            </Button>
          </div>
        )}
      </div>

      {/* 2. CORE METRICS & RATES CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          {
            label: 'Tổng Người Nhận',
            value: '45,200',
            sub: '100%',
            color: 'text-slate-900 dark:text-slate-100',
          },
          {
            label: 'Đã Phát Hành',
            value: '45,200',
            sub: '100% hoàn tất',
            color: 'text-blue-600',
          },
          {
            label: 'Delivered',
            value: '45,119',
            sub: '99.82% Tỷ lệ gửi',
            color: 'text-emerald-600',
          },
          {
            label: 'Đã Mở Thư',
            value: '21,967',
            sub: '48.6% Open Rate',
            color: 'text-emerald-600',
          },
          {
            label: 'Đã Click (CTR)',
            value: '7,412',
            sub: '16.4% Click Rate',
            color: 'text-violet-600',
          },
          {
            label: 'Lỗi Bounces',
            value: '81',
            sub: '0.18% Bounces',
            color: 'text-amber-600',
          },
          {
            label: 'Hủy Nhận Tin',
            value: '14',
            sub: '0.03% RFC 8058',
            color: 'text-slate-400',
          },
        ].map((m, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1"
          >
            <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">{m.label}</span>
            <div className={`text-lg sm:text-xl font-extrabold font-mono ${m.color}`}>
              {m.value}
            </div>
            <div className="text-[10px] font-mono text-slate-400 font-medium truncate">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 3. PERFORMANCE TIMELINE & APPLE PRIVACY NOTICE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hourly Performance Curve (8 Cols) */}
        <Card className="lg:col-span-8">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Tiến Trình Tương Tác Theo Giờ (First 24h Activity)</CardTitle>
              <CardDescription className="text-xs">
                Tốc độ mở thư và nhấp link trong các khung giờ đầu tiên sau khi phát hành.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Lượng Mở Tích Lũy</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-slate-600 dark:text-slate-300">Lượng Click Tích Lũy</span>
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="h-52 flex items-end justify-between gap-3 px-2">
              {HOURLY_TIMELINE.map((point) => {
                const openPct = (point.opened / 22000) * 100
                const clickPct = (point.clicked / 22000) * 100

                return (
                  <div key={point.hour} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-40">
                      <div
                        style={{ height: `${openPct}%` }}
                        className="w-4 bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t transition-all"
                        title={`Mở: ${point.opened.toLocaleString()}`}
                      />
                      <div
                        style={{ height: `${clickPct}%` }}
                        className="w-3 bg-violet-500/80 group-hover:bg-violet-500 rounded-t transition-all"
                        title={`Click: ${point.clicked.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{point.hour}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right: Recipient Status Breakdown & Privacy Disclaimer (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm">Phân Loại Trạng Thái Người Nhận</CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Giao Thành Công (Delivered)</span>
                <span className="font-mono font-bold text-emerald-600">45,119 (99.82%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Hộp Thư Đầy (Soft Bounce)</span>
                <span className="font-mono font-bold text-amber-600">54 (0.12%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Hỏng Hộp Thư (Hard Bounce)</span>
                <span className="font-mono font-bold text-rose-600">27 (0.06%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Hủy Nhận Tin (Unsubscribed)</span>
                <span className="font-mono font-bold text-slate-500">14 (0.03%)</span>
              </div>
            </CardContent>
          </Card>

          {/* Apple MPP Disclaimer */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Lưu Ý Về Chỉ Số Tỷ Lệ Mở (Open Rate)</span>
            </div>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300 leading-relaxed">
              Tỷ lệ mở thư có thể mang tính chất ước tính tương đối do chính sách bảo vệ quyền riêng tư <strong>Apple Mail Privacy Protection (MPP)</strong> và proxy cache của Google Workspace tự động tải trước tracking pixel.
            </p>
          </div>
        </div>
      </div>

      {/* 4. RECIPIENT LOGS TABLE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Nhật Ký Chi Tiết Từng Người Nhận (Recipient Activity)</CardTitle>
            <CardDescription className="text-xs">
              Kiểm tra trạng thái giao thư, tương tác mở và sự kiện nhấp liên kết của từng địa chỉ hòm thư.
            </CardDescription>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="DELIVERED">Delivered (Giao thành công)</option>
              <option value="BOUNCED">Hard Bounce (Hỏng hòm thư)</option>
              <option value="SOFT_BOUNCE">Soft Bounce (Hộp thư đầy)</option>
            </select>

            <select
              value={openFilter}
              onChange={(e) => setOpenFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="all">Tất cả mở thư</option>
              <option value="opened">Đã Mở</option>
              <option value="not_opened">Chưa Mở</option>
            </select>

            <select
              value={clickFilter}
              onChange={(e) => setClickFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="all">Tất cả Click (CTR)</option>
              <option value="clicked">Đã Click Link</option>
              <option value="not_clicked">Chưa Click</option>
            </select>

            <div className="w-48">
              <Input
                placeholder="Tìm email / tên..."
                leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {filteredRecipients.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Không có người nhận nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Khách Hàng / Doanh Nghiệp</th>
                  <th className="py-3 px-4">Địa Chỉ Email</th>
                  <th className="py-3 px-4">Trạng Thái Giao Thư</th>
                  <th className="py-3 px-4 text-center">Đã Mở</th>
                  <th className="py-3 px-4 text-center">Đã Click</th>
                  <th className="py-3 px-4">Sự Kiện Cuối Cùng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecipients.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{r.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{r.company}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {r.email}
                    </td>
                    <td className="py-3 px-4">
                      {r.deliveryStatus === 'DELIVERED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      ) : r.deliveryStatus === 'BOUNCED' ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Hard Bounce</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Soft Bounce</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.hasOpened ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-[10px] font-bold">
                          Đã Mở
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.hasClicked ? (
                        <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-600 text-[10px] font-bold">
                          Đã Click
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium text-[11px] truncate max-w-xs">{r.lastEvent}</div>
                      <div className="font-mono text-[10px] text-slate-400">{r.lastEventTime}</div>
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

export default CampaignReportPage
