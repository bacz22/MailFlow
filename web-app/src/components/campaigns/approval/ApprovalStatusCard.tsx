import React from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Send,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { usePermission, PERMISSIONS } from '../../../permissions'
import type { CampaignStatus } from '../../../types/campaign.types'

export interface ApprovalStatusCardProps {
  status: CampaignStatus
  campaignName: string
  submittedBy?: string
  submittedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  approvalNote?: string
  rejectionReason?: string
  onApproveClick?: () => void
  onRejectClick?: () => void
  onSubmitApprovalClick?: () => void
  onEditClick?: () => void
  onResubmitClick?: () => void
}

export const ApprovalStatusCard: React.FC<ApprovalStatusCardProps> = ({
  status,
  campaignName: _campaignName,
  submittedBy,
  submittedAt,
  reviewedBy,
  reviewedAt,
  approvalNote,
  rejectionReason,
  onApproveClick,
  onRejectClick,
  onSubmitApprovalClick,
  onEditClick,
  onResubmitClick,
}) => {
  const { hasPermission } = usePermission()
  const canApprove = hasPermission(PERMISSIONS.CAMPAIGN_APPROVE)
  const canReject = hasPermission(PERMISSIONS.CAMPAIGN_REJECT)
  const canSubmit = hasPermission(PERMISSIONS.CAMPAIGN_SUBMIT)

  // 1. DRAFT STATE
  if (status === 'DRAFT') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Trạng Thái: Bản Nháp (Draft)
                </span>
                <Badge variant="default" className="text-[10px]">
                  Chưa Gửi Duyệt
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chiến dịch đang trong quá trình chuẩn bị nội dung và đối tượng. Bạn có thể tiếp tục chỉnh sửa hoặc gửi yêu cầu phê duyệt khi hoàn tất.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEditClick && (
              <Button type="button" variant="outline" size="sm" onClick={onEditClick}>
                Chỉnh Sửa
              </Button>
            )}
            {canSubmit && onSubmitApprovalClick && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                leftIcon={<Send className="w-3.5 h-3.5" />}
                onClick={onSubmitApprovalClick}
              >
                Gửi Yêu Cầu Phê Duyệt
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 2. PENDING APPROVAL / WAITING STATE
  if (status === 'PENDING_APPROVAL') {
    return (
      <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  Đang Chờ Phê Duyệt (Awaiting Approval)
                </span>
                <Badge variant="warning" className="text-[10px]">
                  Pending Review
                </Badge>
              </div>
              <div className="text-xs text-amber-800/90 dark:text-amber-300 flex items-center gap-2 flex-wrap">
                <span>Gửi bởi: <strong>{submittedBy || '—'}</strong></span>
                <span>• Thời gian gửi: <span className="font-mono">{submittedAt || '—'}</span></span>
              </div>
            </div>
          </div>

          {/* Action buttons for Managers / Admins */}
          {(canApprove || canReject) && (
            <div className="flex items-center gap-2 shrink-0">
              {canReject && onRejectClick && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  onClick={onRejectClick}
                >
                  Từ Chối
                </Button>
              )}
              {canApprove && onApproveClick && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-white font-bold"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={onApproveClick}
                >
                  Phê Duyệt Chiến Dịch
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 3. APPROVED / SCHEDULED STATE
  if (status === 'APPROVED' || status === 'SCHEDULED') {
    return (
      <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  {status === 'SCHEDULED'
                    ? 'Chiến Dịch Đã Lên Lịch (Scheduled)'
                    : 'Chiến Dịch Đã Được Phê Duyệt (Approved)'}
                </span>
                <Badge variant="success" className="text-[10px]">
                  {status === 'SCHEDULED' ? 'Scheduled' : 'Ready to Dispatch'}
                </Badge>
              </div>
              <div className="text-xs text-emerald-800/80 dark:text-emerald-300">
                {reviewedAt
                  ? <>Phê duyệt lúc <span className="font-mono">{reviewedAt}</span>{reviewedBy ? <> bởi <strong>{reviewedBy}</strong></> : null}</>
                  : 'Đã phê duyệt, sẵn sàng phát hành.'}
              </div>
            </div>
          </div>
        </div>

        {approvalNote && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">Ghi chú của người duyệt: </span>
            <span>{approvalNote}</span>
          </div>
        )}
      </div>
    )
  }

  // 4. REJECTED STATE
  if (status === 'REJECTED') {
    return (
      <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                  Yêu Cầu Bị Từ Chối (Rejected - Changes Requested)
                </span>
                <Badge variant="danger" className="text-[10px]">
                  Cần Chỉnh Sửa
                </Badge>
              </div>
              <div className="text-xs text-rose-800/90 dark:text-rose-300">
                {reviewedAt
                  ? <>Từ chối lúc <span className="font-mono">{reviewedAt}</span>{reviewedBy ? <> bởi <strong>{reviewedBy}</strong></> : null}</>
                  : 'Yêu cầu chỉnh sửa trước khi gửi duyệt lại.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEditClick && (
              <Button type="button" variant="outline" size="sm" onClick={onEditClick}>
                Chỉnh Sửa Chiến Dịch
              </Button>
            )}
            {onResubmitClick && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={onResubmitClick}
              >
                Gửi Duyệt Lại
              </Button>
            )}
          </div>
        </div>

        {/* Mandatory Rejection Reason Callout */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 space-y-1 text-xs">
          <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Lý Do Từ Chối & Yêu Cầu Chỉnh Sửa:</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
            {rejectionReason || 'Không có lý do chi tiết.'}
          </p>
        </div>
      </div>
    )
  }

  return null
}

export default ApprovalStatusCard
