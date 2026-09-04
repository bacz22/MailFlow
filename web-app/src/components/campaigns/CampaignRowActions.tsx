import React from 'react'
import {
  Eye,
  Edit3,
  Copy,
  Trash2,
  Play,
  Pause,
  BarChart3,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu'
import { usePermission, PERMISSIONS } from '../../permissions'
import type { Campaign } from '../../types/campaign.types'

export interface CampaignRowActionsProps {
  campaign: Campaign
  onView: (c: Campaign) => void
  onEdit: (c: Campaign) => void
  onDuplicate: (c: Campaign) => void
  onApprove?: (c: Campaign) => void
  onReject?: (c: Campaign) => void
  onPause?: (c: Campaign) => void
  onResume?: (c: Campaign) => void
  onDelete?: (c: Campaign) => void
  onViewReport?: (c: Campaign) => void
}

export const CampaignRowActions: React.FC<CampaignRowActionsProps> = ({
  campaign,
  onView,
  onEdit,
  onDuplicate,
  onApprove,
  onReject,
  onPause,
  onResume,
  onDelete,
  onViewReport,
}) => {
  const { hasPermission } = usePermission()

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {/* Primary quick CTA based on status */}
      {campaign.status === 'COMPLETED' && (
        <button
          type="button"
          onClick={() => onViewReport?.(campaign)}
          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          title="Báo cáo chi tiết"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Báo Cáo</span>
        </button>
      )}

      {campaign.status === 'SENDING' && hasPermission(PERMISSIONS.CAMPAIGN_PAUSE) && (
        <button
          type="button"
          onClick={() => onPause?.(campaign)}
          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          title="Tạm dừng gửi"
        >
          <Pause className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tạm Dừng</span>
        </button>
      )}

      {campaign.status === 'PAUSED' && hasPermission(PERMISSIONS.CAMPAIGN_SEND) && (
        <button
          type="button"
          onClick={() => onResume?.(campaign)}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          title="Tiếp tục gửi"
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tiếp Tục</span>
        </button>
      )}

      {campaign.status === 'PENDING_APPROVAL' && hasPermission(PERMISSIONS.CAMPAIGN_APPROVE) && (
        <button
          type="button"
          onClick={() => onApprove?.(campaign)}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          title="Phê duyệt chiến dịch"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Duyệt</span>
        </button>
      )}

      {/* Contextual dropdown for all further actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 text-xs">
          <DropdownMenuItem onClick={() => onView(campaign)}>
            <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
            <span>Xem chi tiết chiến dịch</span>
          </DropdownMenuItem>

          {/* Edit - only if DRAFT or SCHEDULED or PENDING_APPROVAL and has CAMPAIGN_UPDATE */}
          {(campaign.status === 'DRAFT' || campaign.status === 'REJECTED') &&
            hasPermission(PERMISSIONS.CAMPAIGN_UPDATE) && (
              <DropdownMenuItem onClick={() => onEdit(campaign)}>
                <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                <span>Chỉnh sửa nội dung</span>
              </DropdownMenuItem>
            )}

          {/* Duplicate */}
          {hasPermission(PERMISSIONS.CAMPAIGN_CREATE) && (
            <DropdownMenuItem onClick={() => onDuplicate(campaign)}>
              <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
              <span>Nhân bản chiến dịch</span>
            </DropdownMenuItem>
          )}

          {/* Pending Approval actions */}
          {campaign.status === 'PENDING_APPROVAL' && hasPermission(PERMISSIONS.CAMPAIGN_APPROVE) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onApprove?.(campaign)}
                className="text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/40 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                <span>Phê duyệt gửi ngay</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onReject?.(campaign)}
                className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
              >
                <XCircle className="w-3.5 h-3.5 mr-2" />
                <span>Từ chối phê duyệt</span>
              </DropdownMenuItem>
            </>
          )}

          {/* Delete action */}
          {(campaign.status === 'DRAFT' || campaign.status === 'CANCELLED' || campaign.status === 'REJECTED') &&
            hasPermission(PERMISSIONS.CAMPAIGN_DELETE) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(campaign)}
                  className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  <span>Xóa chiến dịch</span>
                </DropdownMenuItem>
              </>
            )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default CampaignRowActions
