import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { AcceptInviteForm } from '../components/workspace/AcceptInviteForm'
import { UsageCard } from '../components/dashboard'
import { FeatureComingSoon } from '../components/ui/FeatureComingSoon'
import { usePermission, ROLES } from '../permissions'
import { Badge } from '../components/ui/Badge'

export interface DashboardPageProps {
  onNavigate?: (path: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentRole, roleMetadata } = usePermission()
  const showUsage =
    currentRole === ROLES.OWNER ||
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.BILLING_MANAGER

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Tổng Quan"
        description="Theo dõi hạn mức gửi demo và các lối tắt nhanh. Báo cáo tổng hợp sẽ bổ sung ở giai đoạn sau."
        badge={
          <Badge variant={roleMetadata.badgeVariant} className="text-xs">
            {roleMetadata.name} ({roleMetadata.titleVn})
          </Badge>
        }
      />

      <Card className="border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
        <CardContent className="p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Được mời tham gia workspace?
          </div>
          <p className="text-[11px] text-slate-500">
            Dán mã token trong email thư mời (không cần bấm nút “Chấp nhận lời mời”) sau khi đã đăng
            nhập đúng email được mời.
          </p>
          <AcceptInviteForm />
        </CardContent>
      </Card>

      {showUsage && (
        <div className="max-w-md">
          <UsageCard onUpgrade={() => onNavigate?.('/settings/billing')} />
        </div>
      )}

      {/* Mock metrics / charts / activity feed — ẩn tạm đến khi có API analytics
      <MetricWidget ... />
      <ChartCard />
      <RecentCampaignTable />
      <ActivityFeed />
      */}
      <FeatureComingSoon
        title="Bảng số liệu & biểu đồ tổng quan"
        description="Tính năng đang trong giai đoạn phát triển. Hiện chỉ hỗ trợ theo dõi hạn mức gửi email demo theo ngày."
      />
    </div>
  )
}

export default DashboardPage
