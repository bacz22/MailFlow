import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/layout/PageHeader'
import { FeatureComingSoon } from '../components/ui/FeatureComingSoon'

export interface CampaignReportPageProps {
  campaignId: string
  onNavigate: (path: string) => void
}

/** Báo cáo chi tiết từng recipient / open-click — mock đã ẩn đến khi có analytics API. */
export const CampaignReportPage: React.FC<CampaignReportPageProps> = ({
  campaignId,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate(`/campaigns/${campaignId}`)}
        >
          Quay Lại Chiến Dịch
        </Button>
      </div>

      <PageHeader
        title="Báo Cáo Chiến Dịch (Campaign Report)"
        description="Theo dõi delivery, open, click và nhật ký người nhận theo thời gian thực."
      />

      <FeatureComingSoon
        title="Báo cáo hiệu suất chiến dịch"
        description="Tính năng đang trong giai đoạn phát triển. Bạn vẫn có thể xem trạng thái gửi cơ bản trên trang chi tiết chiến dịch."
      />
    </div>
  )
}

export default CampaignReportPage
