import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { FeatureComingSoon } from '../components/ui/FeatureComingSoon'

export interface AnalyticsPageProps {
  onNavigate?: (path: string) => void
}

/** Analytics UI previously used MOCK_CAMPAIGNS_PERFORMANCE — hidden until real API exists. */
export const AnalyticsPage: React.FC<AnalyticsPageProps> = () => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Báo Cáo & Phân Tích Hiệu Suất (Analytics)"
        description="Theo dõi delivery, open, click và hiệu suất chiến dịch theo thời gian."
      />
      {/* Mock analytics dashboard — ẩn tạm
      const MOCK_CAMPAIGNS_PERFORMANCE = [...]
      <metrics / charts / campaign table />
      */}
      <FeatureComingSoon
        title="Analytics & báo cáo hiệu suất"
        description="Tính năng đang trong giai đoạn phát triển. Bạn vẫn có thể xem trạng thái gửi từng chiến dịch ở mục Campaigns."
      />
    </div>
  )
}

export default AnalyticsPage
