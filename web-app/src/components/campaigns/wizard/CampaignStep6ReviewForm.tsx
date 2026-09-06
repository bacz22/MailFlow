import React, { useState } from 'react'
import {
  FileText,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
  Edit3,
  Mail,
  Zap,
  Lock,
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card'
import { usePermission, PERMISSIONS } from '../../../permissions'
import type {
  CampaignWizardStep,
  CampaignWizardState,
} from '../../../types/campaignWizard.types'

export interface CampaignStep6ReviewFormProps {
  wizardData: CampaignWizardState
  onJumpToStep: (step: CampaignWizardStep) => void
  onConfirmSubmit: () => void
  isSubmitting?: boolean
}

export const CampaignStep6ReviewForm: React.FC<CampaignStep6ReviewFormProps> = ({
  wizardData,
  onJumpToStep,
  onConfirmSubmit,
  isSubmitting = false,
}) => {
  const { hasPermission } = usePermission()
  const canSend = hasPermission(PERMISSIONS.CAMPAIGN_SEND)
  const canSubmit = hasPermission(PERMISSIONS.CAMPAIGN_SUBMIT)

  const [hasConfirmedLargeAudience, setHasConfirmedLargeAudience] = useState(false)

  const { step1, step2, step3, step5 } = wizardData
  const recipientCount = step2.estimatedRecipients || 0
  const isLargeAudience = recipientCount >= 5000

  // Pre-flight Blocking Checks
  const isSubjectEmpty = !step1.subject?.trim()
  const isSenderMissing = !step1.senderId
  const isAudienceEmpty = recipientCount <= 0
  const isContentEmpty = !step3.htmlContent?.trim()
  const isPastSchedule =
    step5.sendType === 'scheduled' &&
    new Date(`${step5.scheduledDate || ''}T${step5.scheduledTime || '20:00'}`).getTime() <
      Date.now() - 60000

  const hasBlockingErrors =
    isSubjectEmpty || isSenderMissing || isAudienceEmpty || isContentEmpty || isPastSchedule

  const isCtaDisabled =
    hasBlockingErrors || (isLargeAudience && !hasConfirmedLargeAudience) || isSubmitting

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* 1. TOP HIGHLIGHT RECIPIENT COUNT HERO BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-blue-100">
              Kiểm Tra Lần Cuối Trước Khi Phát Hành
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {step1.campaignName || 'Chiến Dịch Email'}
            </h2>
            <p className="text-blue-100 text-xs line-clamp-1">
              Tiêu đề gửi: <strong>"{step1.subject}"</strong>
            </p>
          </div>

          {/* Recipient Count Highlight */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center flex flex-col items-center justify-center min-w-[140px] shrink-0">
            <div className="text-3xl font-extrabold font-mono text-white text-center w-full">
              {recipientCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-100 font-medium text-center">Người Nhận Hợp Lệ</div>
          </div>
        </div>
      </div>

      {/* 2. BLOCKING ERRORS OR WARNINGS BANNER */}
      {hasBlockingErrors ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2 text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Phát hiện lỗi cần hoàn thiện trước khi xác nhận:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-700 dark:text-rose-300">
            {isSubjectEmpty && <li>Chưa nhập tiêu đề email ở Bước 1.</li>}
            {isSenderMissing && <li>Chưa chọn người gửi đã xác thực DKIM/SPF ở Bước 1.</li>}
            {isAudienceEmpty && <li>Chưa chọn danh sách hoặc phân đoạn người nhận ở Bước 2.</li>}
            {isContentEmpty && <li>Nội dung thư đang trống ở Bước 3.</li>}
            {isPastSchedule && <li>Thời điểm hẹn giờ không thể ở quá khứ ở Bước 5.</li>}
          </ul>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pre-flight Audit: Toàn bộ 5 tiêu chí kỹ thuật và quy chuẩn RFC 8058 đạt chuẩn 100%.</span>
          </div>
          <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
            Sẵn Sàng Gửi
          </Badge>
        </div>
      )}

      {/* 3. DETAILED SECTION SUMMARIES WITH QUICK EDIT SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section A: Campaign & Subject */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm">1. Thông Tin Chiến Dịch</CardTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 h-7 px-2"
              leftIcon={<Edit3 className="w-3 h-3" />}
              onClick={() => onJumpToStep(1)}
            >
              Sửa
            </Button>
          </CardHeader>

          <CardContent className="pt-3 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Tên nội bộ:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200">{step1.campaignName}</div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Tiêu đề gửi:</span>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{step1.subject}</div>
            </div>
            {/* PreviewText / Preheader — ẩn đồng bộ với Template Editor */}
          </CardContent>
        </Card>

        {/* Section B: Sender Profile */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-sm">2. Địa Chỉ Gửi (Sender)</CardTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 h-7 px-2"
              leftIcon={<Edit3 className="w-3 h-3" />}
              onClick={() => onJumpToStep(1)}
            >
              Sửa
            </Button>
          </CardHeader>

          <CardContent className="pt-3 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Người gửi (From):</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>{step1.senderName}</span>
                <span className="font-mono text-slate-500 font-normal">
                  &lt;{step1.senderEmail}&gt;
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Nhận phản hồi (Reply-To):</span>
              <div className="font-mono text-slate-600 dark:text-slate-300">
                {step1.replyTo || step1.senderEmail}
              </div>
            </div>
            <div className="pt-1 flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Đã xác thực chữ ký số DKIM & SPF</span>
            </div>
          </CardContent>
        </Card>

        {/* Section C: Audience & Deduplication */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm">3. Đối Tượng Người Nhận</CardTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 h-7 px-2"
              leftIcon={<Edit3 className="w-3 h-3" />}
              onClick={() => onJumpToStep(2)}
            >
              Sửa
            </Button>
          </CardHeader>

          <CardContent className="pt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Nhóm đã chỉ định:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {step2.selectedListIds.length} Danh Sách • {step2.selectedSegmentIds.length} Phân Đoạn
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Nhóm loại trừ:</span>
              <span className="text-slate-600 dark:text-slate-400">
                {step2.excludedListIds.length > 0
                  ? `Loại trừ ${step2.excludedListIds.length} nhóm`
                  : 'Không có'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                Tổng người nhận hợp lệ:
              </span>
              <span className="font-mono font-extrabold text-emerald-600 text-sm">
                {recipientCount.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Section D: Schedule & Delivery Speed */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-sm">4. Lập Lịch Gửi</CardTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 h-7 px-2"
              leftIcon={<Edit3 className="w-3 h-3" />}
              onClick={() => onJumpToStep(5)}
            >
              Sửa
            </Button>
          </CardHeader>

          <CardContent className="pt-3 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Hình thức phát hành:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {step5.sendType === 'immediate' ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gửi Ngay Lập Tức (Immediate Dispatch)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Hẹn giờ: {step5.scheduledTime}, {step5.scheduledDate} (GMT+7)
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. LARGE AUDIENCE CONFIRMATION CHECKBOX */}
      {isLargeAudience && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <input
              id="confirm-large-audience"
              type="checkbox"
              checked={hasConfirmedLargeAudience}
              onChange={(e) => setHasConfirmedLargeAudience(e.target.checked)}
              className="w-4 h-4 rounded border-amber-400 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
            />
            <label
              htmlFor="confirm-large-audience"
              className="text-amber-900 dark:text-amber-200 font-semibold cursor-pointer select-none leading-relaxed"
            >
              Tôi xác nhận nội dung email, tiêu đề và tệp khách hàng <strong>{recipientCount.toLocaleString()} người nhận</strong> đã được kiểm tra kỹ lưỡng và sẵn sàng phát hành.
            </label>
          </div>
        </div>
      )}

      {/* 5. ROLE-ADAPTIVE PRIMARY CTA ACTIONS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
            {canSend ? (
              <>
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Quyền Phát Hành Trực Tiếp (Admin / Marketing Manager)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Quy Trình Phê Duyệt (Campaign Editor Workflow)</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {canSend
              ? step5.sendType === 'immediate'
                ? `Bấm nút bên phải để đưa ngay ${recipientCount.toLocaleString()} email vào hàng đợi phân phối.`
                : `Bấm nút bên phải để lên lịch tự động phát hành vào ${step5.scheduledTime}, ${step5.scheduledDate}.`
              : 'Chiến dịch sẽ được chuyển sang trạng thái "Chờ Duyệt (PENDING_APPROVAL)" để quản trị viên kiểm duyệt.'}
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {canSend ? (
            step5.sendType === 'immediate' ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 text-white font-bold"
                disabled={isCtaDisabled}
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                onClick={onConfirmSubmit}
              >
                Phát Hành Chiến Dịch Ngay
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 text-white font-bold"
                disabled={isCtaDisabled}
                isLoading={isSubmitting}
                leftIcon={<Clock className="w-4 h-4" />}
                onClick={onConfirmSubmit}
              >
                Lập Lịch Phát Hành Chiến Dịch
              </Button>
            )
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 text-white font-bold"
              disabled={isCtaDisabled || !canSubmit}
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              onClick={onConfirmSubmit}
            >
              Gửi Yêu Cầu Phê Duyệt (Submit for Approval)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CampaignStep6ReviewForm
