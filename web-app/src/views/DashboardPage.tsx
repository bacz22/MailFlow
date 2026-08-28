import React from 'react'
import {
  Users,
  Send,
  CheckCircle2,
  TrendingUp,
  FileText,
  Clock,
  HardDrive,
  BarChart3,
  UserCheck,
  UserX,
  CreditCard,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { AcceptInviteForm } from '../components/workspace/AcceptInviteForm'
import {
  MetricWidget,
  ChartCard,
  QuickActionCard,
  RecentCampaignTable,
  ActivityFeed,
  UsageCard,
  PendingApprovalCard,
  RecentImportCard,
  RecentInvoicesCard,
} from '../components/dashboard'
import { usePermission, ROLES } from '../permissions'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { RefreshCw, Download } from 'lucide-react'
import { useToast } from '../components/ui/Toast'

export interface DashboardPageProps {
  onNavigate?: (path: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentRole, roleMetadata } = usePermission()
  const { showToast } = useToast()

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title={`Dashboard Tổng Quan`}
        description="Theo dõi số liệu phân phối email, chiến dịch đang chạy và các chỉ số tương tác theo thời gian thực."
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </span>
            <Badge variant={roleMetadata.badgeVariant} className="text-xs">
              {roleMetadata.name} ({roleMetadata.titleVn})
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() =>
                showToast({
                  type: 'info',
                  title: 'Đã làm mới',
                  description: 'Số liệu thống kê đã được cập nhật mới nhất.',
                })
              }
            >
              Làm Mới
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() =>
                showToast({
                  type: 'success',
                  title: 'Xuất báo cáo',
                  description: 'Đang chuẩn bị file báo cáo tổng quan PDF...',
                })
              }
            >
              Xuất Báo Cáo
            </Button>
          </div>
        }
      />

      <Card className="border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
        <CardContent className="p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Được mời tham gia workspace?
          </div>
          <p className="text-[11px] text-slate-500">
            Dán mã token trong email thư mời (không cần bấm nút “Chấp nhận lời mời”) sau khi đã đăng nhập đúng email được mời.
          </p>
          <AcceptInviteForm />
        </CardContent>
      </Card>

      {/* 2. DYNAMIC METRIC CARDS (Based on Role) */}

      {/* A. OWNER & ADMIN METRICS */}
      {(currentRole === ROLES.OWNER || currentRole === ROLES.ADMIN) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricWidget
            label="Tổng Danh Bạ (Contacts)"
            value="14,250"
            change="+8.4%"
            trend="up"
            icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            sparklineData={[11200, 11800, 12500, 13100, 13700, 14250]}
            onClick={() => onNavigate?.('/contacts')}
          />
          <MetricWidget
            label="Chiến Dịch Đang Chạy"
            value="3 Live"
            change="3 Active"
            trend="neutral"
            trendLabel="đang gửi realtime"
            icon={<Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            iconBgColor="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            sparklineData={[1, 2, 2, 4, 3, 3]}
            onClick={() => onNavigate?.('/campaigns')}
          />
          <MetricWidget
            label="Email Đã Gửi Tháng Này"
            value="142,850"
            change="+12.4%"
            trend="up"
            icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            sparklineData={[98000, 105000, 118000, 129000, 142850]}
          />
          <MetricWidget
            label="Tỷ Lệ Giao Thành Công"
            value="99.82%"
            change="+0.14%"
            trend="up"
            trendLabel="Inbox rate"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            sparklineData={[99.4, 99.5, 99.6, 99.7, 99.82]}
          />
        </div>
      )}

      {/* B. MARKETING MANAGER METRICS */}
      {currentRole === ROLES.MARKETING_MANAGER && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <MetricWidget
            label="Tổng Chiến Dịch"
            value="42"
            change="3 Live"
            trend="neutral"
            icon={<Send className="w-4 h-4" />}
            onClick={() => onNavigate?.('/campaigns')}
          />
          <MetricWidget
            label="Email Đã Gửi"
            value="142,850"
            change="+12.4%"
            trend="up"
            icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          />
          <MetricWidget
            label="Tỷ Lệ Giao (Delivery)"
            value="99.8%"
            change="+0.2%"
            trend="up"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          />
          <MetricWidget
            label="Tỷ Lệ Mở (Open Rate)"
            value="68.2%"
            change="+3.1%"
            trend="up"
            icon={<BarChart3 className="w-4 h-4 text-indigo-600" />}
          />
          <MetricWidget
            label="Tỷ Lệ Nhấp (CTR)"
            value="24.5%"
            change="+0.8%"
            trend="up"
            icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
          />
        </div>
      )}

      {/* C. CAMPAIGN EDITOR METRICS */}
      {currentRole === ROLES.CAMPAIGN_EDITOR && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricWidget
            label="Bản Nháp Của Tôi (My Drafts)"
            value="6 Bản Nháp"
            trend="neutral"
            trendLabel="đang biên tập"
            icon={<FileText className="w-5 h-5 text-amber-600" />}
            iconBgColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            sparklineData={[4, 5, 6, 7, 6]}
            onClick={() => onNavigate?.('/campaigns')}
          />
          <MetricWidget
            label="Chờ Phê Duyệt"
            value="2 Yêu Cầu"
            trend="neutral"
            trendLabel="đã gửi Quản lý"
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            sparklineData={[1, 2, 1, 3, 2]}
          />
          <MetricWidget
            label="Thư Viện Mẫu (Templates)"
            value="18 Mẫu"
            trend="neutral"
            trendLabel="sẵn sàng tái sử dụng"
            icon={<FileText className="w-5 h-5 text-emerald-600" />}
            iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            sparklineData={[12, 14, 15, 17, 18]}
            onClick={() => onNavigate?.('/templates')}
          />
        </div>
      )}

      {/* D. CONTACT MANAGER METRICS */}
      {currentRole === ROLES.CONTACT_MANAGER && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricWidget
            label="Tổng Danh Bạ (Total Contacts)"
            value="14,250"
            change="+8.4%"
            trend="up"
            icon={<Users className="w-5 h-5 text-blue-600" />}
            sparklineData={[12000, 12600, 13100, 13800, 14250]}
            onClick={() => onNavigate?.('/contacts')}
          />
          <MetricWidget
            label="Liên Hệ Đang Hoạt Động"
            value="13,820"
            change="97.0%"
            trend="up"
            trendLabel="đã xác thực email"
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            sparklineData={[11600, 12200, 12700, 13400, 13820]}
          />
          <MetricWidget
            label="Liên Hệ Mới Tuần Này"
            value="+342"
            change="+14.2%"
            trend="up"
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            sparklineData={[180, 210, 240, 290, 342]}
          />
          <MetricWidget
            label="Tỷ Lệ Hủy Đăng Ký (RFC 8058)"
            value="0.04%"
            change="-0.01%"
            trend="up"
            trendLabel="rất thấp & an toàn"
            icon={<UserX className="w-5 h-5 text-slate-500" />}
            iconBgColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            sparklineData={[0.08, 0.06, 0.05, 0.04]}
          />
        </div>
      )}

      {/* E. ANALYST METRICS */}
      {currentRole === ROLES.ANALYST && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <MetricWidget
            label="Email Đã Gửi"
            value="142,850"
            change="+12.4%"
            trend="up"
            icon={<Send className="w-4 h-4" />}
          />
          <MetricWidget
            label="Tỷ Lệ Delivery"
            value="99.82%"
            change="+0.14%"
            trend="up"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          />
          <MetricWidget
            label="Tỷ Lệ Mở (Open)"
            value="68.2%"
            change="+3.1%"
            trend="up"
            icon={<BarChart3 className="w-4 h-4 text-indigo-600" />}
          />
          <MetricWidget
            label="Tỷ Lệ Nhấp (CTR)"
            value="24.5%"
            change="+0.8%"
            trend="up"
            icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          />
          <MetricWidget
            label="Tỷ Lệ Trả Về (Bounce)"
            value="0.12%"
            change="-0.05%"
            trend="up"
            trendLabel="cực thấp"
            icon={<TrendingUp className="w-4 h-4 text-rose-500" />}
          />
        </div>
      )}

      {/* F. BILLING MANAGER METRICS */}
      {currentRole === ROLES.BILLING_MANAGER && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricWidget
            label="Gói Đang Sử Dụng"
            value="Enterprise"
            trend="neutral"
            trendLabel="500k emails/tháng"
            icon={<HardDrive className="w-5 h-5 text-blue-600" />}
          />
          <MetricWidget
            label="Email Đã Sử Dụng"
            value="142,850 / 500k"
            change="28.5%"
            trend="neutral"
            trendLabel="hạn ngạch"
            icon={<Send className="w-5 h-5 text-emerald-600" />}
            sparklineData={[40, 80, 110, 130, 142]}
          />
          <MetricWidget
            label="Danh Bạ Đã Sử Dụng"
            value="14,250 / 50k"
            change="28.5%"
            trend="neutral"
            icon={<Users className="w-5 h-5 text-indigo-600" />}
            sparklineData={[10, 11, 12, 13, 14.2]}
          />
          <MetricWidget
            label="Kỳ Hóa Đơn Tiếp Theo"
            value="$199.00"
            trend="neutral"
            trendLabel="01/09/2026"
            icon={<CreditCard className="w-5 h-5 text-amber-600" />}
            iconBgColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </div>
      )}

      {/* G. VIEWER METRICS */}
      {currentRole === ROLES.VIEWER && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricWidget
            label="Tổng Danh Bạ"
            value="14,250"
            change="+8.4%"
            trend="up"
            icon={<Users className="w-5 h-5 text-blue-600" />}
            sparklineData={[12000, 13000, 14250]}
          />
          <MetricWidget
            label="Email Đã Gửi"
            value="142,850"
            change="+12.4%"
            trend="up"
            icon={<Send className="w-5 h-5 text-indigo-600" />}
            sparklineData={[110000, 125000, 142850]}
          />
          <MetricWidget
            label="Tỷ Lệ Mở Trung Bình"
            value="68.2%"
            change="+3.1%"
            trend="up"
            icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
            sparklineData={[62, 65, 68.2]}
          />
        </div>
      )}

      {/* 3. MAIN DASHBOARD GRID WIDGETS (Role-tailored layout) */}

      {/* Marketing Manager Specific Approval Queue */}
      {currentRole === ROLES.MARKETING_MANAGER && (
        <PendingApprovalCard />
      )}

      {/* Chart & Quick Action Grid */}
      {currentRole !== ROLES.BILLING_MANAGER && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <ChartCard />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <QuickActionCard onNavigate={onNavigate} />
            {(currentRole === ROLES.OWNER || currentRole === ROLES.ADMIN) && (
              <UsageCard onUpgrade={() => onNavigate?.('/settings/billing')} />
            )}
          </div>
        </div>
      )}

      {/* Contact Manager Specific Layout */}
      {currentRole === ROLES.CONTACT_MANAGER && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <RecentImportCard onViewContacts={() => onNavigate?.('/contacts')} />
          </div>
          <div className="lg:col-span-4">
            <QuickActionCard onNavigate={onNavigate} />
          </div>
        </div>
      )}

      {/* Billing Manager Specific Layout */}
      {currentRole === ROLES.BILLING_MANAGER && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <UsageCard onUpgrade={() => onNavigate?.('/settings/billing')} />
          </div>
          <div className="lg:col-span-6">
            <RecentInvoicesCard />
          </div>
        </div>
      )}

      {/* Campaign Editor Specific Layout */}
      {currentRole === ROLES.CAMPAIGN_EDITOR && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <RecentCampaignTable
              onViewAll={() => onNavigate?.('/campaigns')}
              onSelectCampaign={() => onNavigate?.('/campaigns')}
            />
          </div>
          <div className="lg:col-span-4">
            <QuickActionCard onNavigate={onNavigate} />
          </div>
        </div>
      )}

      {/* Bottom Table & Activity Feed (For Owner, Admin, Marketing Manager, Analyst, Viewer) */}
      {(currentRole === ROLES.OWNER ||
        currentRole === ROLES.ADMIN ||
        currentRole === ROLES.MARKETING_MANAGER ||
        currentRole === ROLES.ANALYST ||
        currentRole === ROLES.VIEWER) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={currentRole === ROLES.ANALYST || currentRole === ROLES.VIEWER ? 'lg:col-span-12' : 'lg:col-span-8'}>
            <RecentCampaignTable
              onViewAll={() => onNavigate?.('/campaigns')}
              onSelectCampaign={() => onNavigate?.('/campaigns')}
            />
          </div>
          {currentRole !== ROLES.ANALYST && currentRole !== ROLES.VIEWER && (
            <div className="lg:col-span-4">
              <ActivityFeed />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardPage
