import React from 'react'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { PermissionGate, PERMISSIONS } from '../../permissions'

export interface PendingCampaign {
  id: string
  name: string
  submittedBy: string
  recipients: number
  scheduledFor: string
}

export interface PendingApprovalCardProps {
  campaigns?: PendingCampaign[]
  className?: string
}

export const PendingApprovalCard: React.FC<PendingApprovalCardProps> = ({
  campaigns,
  className,
}) => {
  const { showToast } = useToast()

  const defaultItems: PendingCampaign[] = [
    {
      id: 'p-1',
      name: 'Mid-Year Flash Sale 50% Off',
      submittedBy: 'Nguyễn Văn Editor',
      recipients: 18400,
      scheduledFor: '28/08 lúc 14:00',
    },
    {
      id: 'p-2',
      name: 'Khảo sát độ hài lòng khách hàng Q3',
      submittedBy: 'Lê Hoàng Content',
      recipients: 5200,
      scheduledFor: '30/08 lúc 09:00',
    },
  ]

  const items = campaigns || defaultItems

  const handleApprove = (name: string) => {
    showToast({
      type: 'success',
      title: 'Đã phê duyệt chiến dịch',
      description: `Chiến dịch "${name}" đã được duyệt và chuyển sang hàng đợi phát sóng.`,
    })
  }

  const handleReject = (name: string) => {
    showToast({
      type: 'warning',
      title: 'Đã từ chối',
      description: `Đã yêu cầu người tạo chỉnh sửa lại chiến dịch "${name}".`,
    })
  }

  if (items.length === 0) return null

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-base">Chờ Phê Duyệt Gửi (Pending Approval)</CardTitle>
        </div>
        <Badge variant="warning" className="text-xs">
          {items.length} Yêu Cầu
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {item.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                <span>Người tạo: <strong>{item.submittedBy}</strong></span>
                <span>•</span>
                <span>Quy mô: <strong className="font-mono text-slate-700 dark:text-slate-300">{item.recipients.toLocaleString()} email</strong></span>
                <span>•</span>
                <span>Lịch phát: <strong>{item.scheduledFor}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <PermissionGate permission={PERMISSIONS.CAMPAIGN_APPROVE}>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={() => handleApprove(item.name)}
                >
                  Phê Duyệt
                </Button>
              </PermissionGate>

              <PermissionGate permission={PERMISSIONS.CAMPAIGN_REJECT}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  onClick={() => handleReject(item.name)}
                >
                  Từ Chối
                </Button>
              </PermissionGate>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default PendingApprovalCard
