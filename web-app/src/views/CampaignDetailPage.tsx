import React, { useState } from 'react'
import {
  ArrowLeft,
  Clock,
  Mail,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  XCircle,
  Check,
  X,
  Copy,
  Edit3,
  BarChart3,
  Trash2,
  Monitor,
  Smartphone,
  ShieldCheck,
  Layers,
  Sparkles,
  History,
  Info,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { CampaignStatusBadge } from '../components/campaigns/CampaignStatusBadge'
import { ApprovalStatusCard } from '../components/campaigns/approval/ApprovalStatusCard'
import { ApproveCampaignDialog } from '../components/campaigns/approval/ApproveCampaignDialog'
import { RejectCampaignDialog } from '../components/campaigns/approval/RejectCampaignDialog'
import { ApprovalHistory, type ApprovalLogEntry } from '../components/campaigns/approval/ApprovalHistory'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import type { Campaign, CampaignStatus } from '../types/campaign.types'

export interface CampaignDetailPageProps {
  campaignId: string
  onNavigate: (path: string) => void
}

interface CampaignTimelineEvent {
  id: string
  action: string
  actor: string
  actorRole: string
  timestamp: string
  icon: React.ReactNode
  variant: 'default' | 'success' | 'warning' | 'info' | 'danger'
  note?: string
}

const MOCK_CAMPAIGN_DATA: Record<string, Campaign & {
  previewText?: string
  senderName: string
  senderEmail: string
  replyTo: string
  scheduledTimezone?: string
  batchSpeed: string
  htmlContent: string
  selectedLists: { id: string; name: string; count: number }[]
  selectedSegments: { id: string; name: string; count: number }[]
  excludedLists: { id: string; name: string; count: number }[]
  timeline: CampaignTimelineEvent[]
}> = {
  'cmp-1': {
    id: 'cmp-1',
    name: 'Bản Tin Công Nghệ & Khuyến Mãi Q3/2026',
    status: 'PENDING_APPROVAL',
    subject: '🔥 Khám phá các tính năng tự động hóa email mới nhất tháng 8',
    previewText: 'Bí quyết tăng tỷ lệ mở hộp thư lên 99.8% cho doanh nghiệp SaaS.',
    senderName: 'MailFlow Product Team',
    senderEmail: 'newsletter@mailflow.vn',
    replyTo: 'support@mailflow.vn',
    recipientCount: 45200,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    audienceName: 'VIP Enterprise Clients + 2 nhóm khác',
    audienceType: 'list',
    scheduledAt: '27/08/2026 09:00',
    scheduledTimezone: 'Asia/Bangkok (UTC+07:00)',
    batchSpeed: 'Tối đa (~10,000 email/phút)',
    createdBy: 'Nguyễn Văn Editor',
    createdAt: '25/08/2026 14:30',
    updatedAt: '26/08/2026 10:15',
    htmlContent: `
      <p>Xin chào <strong>{{firstName}}</strong>,</p>
      <p>Chúng tôi vô cùng hào hứng giới thiệu <strong>MailFlow 2.0</strong> — giải pháp gửi email hàng loạt với độ ổn định Inbox đạt 99.8%.</p>
      <p>Với hạ tầng Dedicated IP và chuẩn mã hóa DKIM tự động, doanh nghiệp <em>{{company}}</em> sẽ tối ưu hiệu suất chuyển đổi lên tới 300%.</p>
    `,
    selectedLists: [
      { id: 'lst-1', name: 'VIP Enterprise Clients', count: 32000 },
      { id: 'lst-2', name: 'Subscribers Q3', count: 18000 },
    ],
    selectedSegments: [
      { id: 'seg-1', name: 'Khách Hàng VIP Hà Nội', count: 4200 },
    ],
    excludedLists: [
      { id: 'lst-ex', name: 'Khách Hàng Đã Mua Gần Đây', count: 2100 },
    ],
    timeline: [
      {
        id: 't-1',
        action: 'Khởi tạo bản nháp chiến dịch',
        actor: 'Nguyễn Văn Editor',
        actorRole: 'Campaign Editor',
        timestamp: '25/08/2026 14:30',
        icon: <Edit3 className="w-3.5 h-3.5" />,
        variant: 'default',
      },
      {
        id: 't-2',
        action: 'Gửi yêu cầu phê duyệt',
        actor: 'Nguyễn Văn Editor',
        actorRole: 'Campaign Editor',
        timestamp: '26/08/2026 10:15',
        icon: <Clock className="w-3.5 h-3.5" />,
        variant: 'warning',
        note: 'Đã hoàn tất kiểm tra nội dung và tệp 45,200 khách hàng.',
      },
    ],
  },
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({
  campaignId,
  onNavigate,
}) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'audience' | 'activity'>('overview')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [currentStatus, setCurrentStatus] = useState<CampaignStatus>(
    MOCK_CAMPAIGN_DATA[campaignId]?.status || 'PENDING_APPROVAL'
  )
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<string | null>(null)

  // Approval Workflow Modal States
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [approvalNote, setApprovalNote] = useState<string>('')
  const [rejectionReason, setRejectionReason] = useState<string>('')

  const [approvalLogs, setApprovalLogs] = useState<ApprovalLogEntry[]>([
    {
      id: 'app-1',
      action: 'SUBMITTED',
      actor: 'Nguyễn Văn Editor',
      actorRole: 'Campaign Editor',
      timestamp: '26/08/2026 10:15',
      note: 'Đã hoàn tất kiểm tra tiêu đề, nội dung và tệp 45,200 người nhận.',
    },
  ])

  const campaign = MOCK_CAMPAIGN_DATA[campaignId] || {
    ...MOCK_CAMPAIGN_DATA['cmp-1'],
    id: campaignId,
    name: `Chiến Dịch Email #${campaignId}`,
  }

  // Handle Contextual Actions
  const handleActionClick = (action: string) => {
    if (action === 'approve') {
      setIsApproveOpen(true)
      return
    }
    if (action === 'reject') {
      setIsRejectOpen(true)
      return
    }
    setModalAction(action)
    setIsConfirmModalOpen(true)
  }

  // Approval Workflow Handlers
  const handleConfirmApprove = (note?: string) => {
    setCurrentStatus('APPROVED')
    setApprovalNote(note || 'Nội dung và danh sách đạt chuẩn 100%. Sẵn sàng phát hành.')
    setApprovalLogs((prev) => [
      {
        id: Date.now().toString(),
        action: 'APPROVED',
        actor: 'Trần Minh Marketing',
        actorRole: 'Marketing Manager',
        timestamp: 'Vừa xong',
        note: note || 'Phê duyệt chiến dịch.',
      },
      ...prev,
    ])
    showToast({
      type: 'success',
      title: 'Đã phê duyệt chiến dịch',
      description: 'Chiến dịch đã sẵn sàng phát hành theo lịch.',
    })
  }

  const handleConfirmReject = (reason: string) => {
    setCurrentStatus('REJECTED')
    setRejectionReason(reason)
    setApprovalLogs((prev) => [
      {
        id: Date.now().toString(),
        action: 'REJECTED',
        actor: 'Trần Minh Marketing',
        actorRole: 'Marketing Manager',
        timestamp: 'Vừa xong',
        note: reason,
      },
      ...prev,
    ])
    showToast({
      type: 'error',
      title: 'Đã từ chối chiến dịch',
      description: 'Yêu cầu chỉnh sửa đã được gửi tới tác giả.',
    })
  }

  const handleSubmitForApproval = () => {
    setCurrentStatus('PENDING_APPROVAL')
    setApprovalLogs((prev) => [
      {
        id: Date.now().toString(),
        action: 'RESUBMITTED',
        actor: 'Nguyễn Văn Editor',
        actorRole: 'Campaign Editor',
        timestamp: 'Vừa xong',
        note: 'Đã gửi duyệt lại sau khi chỉnh sửa theo phản hồi.',
      },
      ...prev,
    ])
    showToast({
      type: 'success',
      title: 'Đã gửi yêu cầu phê duyệt',
      description: 'Chiến dịch đã được chuyển tới Admin để kiểm duyệt.',
    })
  }

  const handleExecuteModalAction = () => {
    setIsConfirmModalOpen(false)
    if (modalAction === 'pause') {
      setCurrentStatus('PAUSED')
      showToast({
        type: 'warning',
        title: 'Đã tạm dừng chiến dịch',
        description: 'Tiến trình gửi đã được dừng lại an toàn.',
      })
    } else if (modalAction === 'resume') {
      setCurrentStatus('SENDING')
      showToast({
        type: 'success',
        title: 'Đang tiếp tục gửi',
        description: 'Chiến dịch đã được kích hoạt phân phối tiếp.',
      })
    } else if (modalAction === 'cancel') {
      setCurrentStatus('CANCELLED')
      showToast({
        type: 'info',
        title: 'Đã hủy chiến dịch',
        description: 'Lịch phát hành chiến dịch đã được hủy bỏ.',
      })
    } else if (modalAction === 'delete') {
      showToast({
        type: 'error',
        title: 'Đã xóa chiến dịch',
        description: 'Chiến dịch đã được xóa khỏi hệ thống.',
      })
      onNavigate('/campaigns')
    } else if (modalAction === 'duplicate') {
      showToast({
        type: 'success',
        title: 'Đã nhân bản chiến dịch',
        description: 'Bản sao mới đã được tạo dưới dạng Bản nháp (DRAFT).',
      })
      onNavigate('/campaigns/create')
    }
  }

  const progressPercent = Math.round(
    ((campaign.sentCount || 0) / (campaign.recipientCount || 1)) * 100
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button & Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate('/campaigns')}
          >
            Quay Lại Danh Sách Chiến Dịch
          </Button>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {campaign.name}
            </h1>
            <CampaignStatusBadge status={currentStatus} />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tạo bởi <strong className="text-slate-600 dark:text-slate-300">{campaign.createdBy}</strong> lúc {campaign.createdAt}</span>
            <span>• Cập nhật: {campaign.updatedAt}</span>
          </div>
        </div>

        {/* CONTEXTUAL ACTION BUTTONS TOOLBAR */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* DRAFT ACTIONS */}
          {currentStatus === 'DRAFT' && (
            <>
              {hasPermission(PERMISSIONS.CAMPAIGN_UPDATE) && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => onNavigate('/campaigns/create')}
                >
                  Tiếp Tục Soạn
                </Button>
              )}
              {hasPermission(PERMISSIONS.CAMPAIGN_CREATE) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('duplicate')}
                >
                  Nhân Bản
                </Button>
              )}
              {hasPermission(PERMISSIONS.CAMPAIGN_DELETE) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('delete')}
                >
                  Xóa
                </Button>
              )}
            </>
          )}

          {/* PENDING APPROVAL ACTIONS */}
          {currentStatus === 'PENDING_APPROVAL' && (
            <>
              {hasPermission(PERMISSIONS.CAMPAIGN_APPROVE) && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md"
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('approve')}
                >
                  Phê Duyệt
                </Button>
              )}
              {hasPermission(PERMISSIONS.CAMPAIGN_REJECT) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-300 hover:bg-rose-50"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('reject')}
                >
                  Từ Chối
                </Button>
              )}
            </>
          )}

          {/* SCHEDULED ACTIONS */}
          {currentStatus === 'SCHEDULED' && (
            <>
              {hasPermission(PERMISSIONS.CAMPAIGN_UPDATE) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Clock className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('reschedule')}
                >
                  Đổi Lịch Gửi
                </Button>
              )}
              {hasPermission(PERMISSIONS.CAMPAIGN_CANCEL) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600"
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('cancel')}
                >
                  Hủy Lịch
                </Button>
              )}
            </>
          )}

          {/* SENDING ACTIONS */}
          {currentStatus === 'SENDING' && hasPermission(PERMISSIONS.CAMPAIGN_PAUSE) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
              leftIcon={<Pause className="w-3.5 h-3.5" />}
              onClick={() => handleActionClick('pause')}
            >
              Tạm Dừng Gửi
            </Button>
          )}

          {/* PAUSED ACTIONS */}
          {currentStatus === 'PAUSED' && (
            <>
              {hasPermission(PERMISSIONS.CAMPAIGN_SEND) && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('resume')}
                >
                  Tiếp Tục Gửi
                </Button>
              )}
              {hasPermission(PERMISSIONS.CAMPAIGN_CANCEL) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600"
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('cancel')}
                >
                  Hủy Chiến Dịch
                </Button>
              )}
            </>
          )}

          {/* COMPLETED ACTIONS */}
          {currentStatus === 'COMPLETED' && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<BarChart3 className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('/analytics')}
              >
                Xem Báo Cáo Phân Tích
              </Button>
              {hasPermission(PERMISSIONS.CAMPAIGN_CREATE) && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => handleActionClick('duplicate')}
                >
                  Nhân Bản
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* READONLY BANNER FOR VIEWER / AUDITOR */}
      <ReadOnlyBanner resourceName="chiến dịch này" />

      {/* APPROVAL STATUS CARD (Prompt 22) */}
      {(currentStatus === 'DRAFT' ||
        currentStatus === 'PENDING_APPROVAL' ||
        currentStatus === 'APPROVED' ||
        currentStatus === 'REJECTED') && (
        <ApprovalStatusCard
          status={currentStatus}
          campaignName={campaign.name}
          submittedBy={campaign.createdBy}
          submittedAt="26/08/2026 10:15"
          reviewedBy="Trần Minh Marketing (Marketing Manager)"
          reviewedAt="26/08/2026 16:45"
          approvalNote={approvalNote}
          rejectionReason={rejectionReason}
          onApproveClick={() => setIsApproveOpen(true)}
          onRejectClick={() => setIsRejectOpen(true)}
          onSubmitApprovalClick={handleSubmitForApproval}
          onEditClick={() => onNavigate('/campaigns/create')}
          onResubmitClick={handleSubmitForApproval}
        />
      )}

      {/* 4 TAB SWITCHER */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        {[
          { id: 'overview', label: 'Tổng Quan', icon: <Info className="w-4 h-4" /> },
          { id: 'content', label: 'Nội Dung Thư', icon: <Mail className="w-4 h-4" /> },
          { id: 'audience', label: 'Đối Tượng Người Nhận', icon: <Users className="w-4 h-4" /> },
          { id: 'activity', label: 'Nhật Ký Hoạt Động & Phê Duyệt', icon: <History className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-0">
          {/* Sending Progress Bar (If Sending or Paused) */}
          {(currentStatus === 'SENDING' || currentStatus === 'PAUSED' || currentStatus === 'COMPLETED') && (
            <Card className="border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/40 to-indigo-50/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Tiến Độ Phân Phối Email:
                    </span>
                    <span className="font-mono text-blue-600 font-bold">
                      {campaign.sentCount?.toLocaleString()} / {campaign.recipientCount?.toLocaleString()}
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-blue-600">{progressPercent}%</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentStatus === 'PAUSED' ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Tốc độ gửi: {campaign.batchSpeed}</span>
                  <span className="text-emerald-600 font-semibold">Tỷ lệ lỗi Bounces: 0.18% (Rất thấp)</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Tổng Người Nhận</div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {campaign.recipientCount?.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Đã Gửi Thành Công</div>
              <div className="text-2xl font-extrabold font-mono text-blue-600">
                {campaign.sentCount?.toLocaleString() || 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Tỷ Lệ Mở (Open Rate)</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-600">
                {campaign.openRate ? `${campaign.openRate}%` : '—'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Tỷ Lệ Click (CTR)</div>
              <div className="text-2xl font-extrabold font-mono text-violet-600">
                {campaign.clickRate ? `${campaign.clickRate}%` : '—'}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm">Thông Tin Thư & Người Gửi</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Tiêu đề thư:</span>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {campaign.subject}
                  </div>
                </div>
                {campaign.previewText && (
                  <div>
                    <span className="text-slate-400 text-[11px]">Đoạn xem trước (Preheader):</span>
                    <div className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                      {campaign.previewText}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[11px]">Địa chỉ gửi (From):</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span>{campaign.senderName} &lt;{campaign.senderEmail}&gt;</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Nhận phản hồi (Reply-To):</span>
                  <div className="font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                    {campaign.replyTo}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm">Lập Lịch & Hạ Tầng Phân Phối</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Thời điểm kích hoạt:</span>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {campaign.scheduledAt || 'Gửi ngay lập tức'} ({campaign.scheduledTimezone || 'Asia/Bangkok'})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Tốc độ phân phối:</span>
                  <div className="font-semibold text-indigo-600 mt-0.5">
                    {campaign.batchSpeed}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Tuân thủ tiêu chuẩn:</span>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RFC 8058 1-Click List-Unsubscribe</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CONTENT PREVIEW ================= */}
      {activeTab === 'content' && (
        <div className="space-y-4 animate-in fade-in-0">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Bản Xem Trước Nội Dung (Read-only Preview)
            </div>
            {/* Viewport switch */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  device === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  device === 'mobile'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-center">
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden ${
                device === 'mobile' ? 'w-[360px]' : 'w-full max-w-2xl'
              }`}
            >
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">{campaign.subject}</div>
                <div className="text-[11px] text-slate-400">Từ: {campaign.senderName} &lt;{campaign.senderEmail}&gt;</div>
              </div>
              <div
                className="p-6 text-xs leading-relaxed space-y-3 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.htmlContent }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AUDIENCE ================= */}
      {activeTab === 'audience' && (
        <div className="space-y-6 animate-in fade-in-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm">Danh Sách Người Nhận Đã Chọn</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {campaign.selectedLists.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-blue-900 dark:text-blue-200">{l.name}</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                      {l.count.toLocaleString()} liên hệ
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <CardTitle className="text-sm">Phân Đoạn Động Đã Chỉ Định</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {campaign.selectedSegments.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-violet-900 dark:text-violet-200">{s.name}</span>
                    <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
                      {s.count.toLocaleString()} liên hệ
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ================= TAB 4: ACTIVITY & APPROVAL TIMELINE ================= */}
      {activeTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in-0">
          {/* Approval History Component (Prompt 22) */}
          <ApprovalHistory logs={approvalLogs} />

          {/* General Execution Activity Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Nhật Ký Tiến Trình Hệ Thống</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Ghi lại lịch sử phân phối thư và sự kiện tương tác tự động.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {campaign.timeline.map((event) => (
                  <div key={event.id} className="relative group text-xs">
                    {/* Timeline node icon */}
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 flex items-center justify-center shadow-xs">
                      {event.icon}
                    </div>

                    <div className="space-y-1 pl-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {event.action}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{event.timestamp}</span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Thực hiện bởi: <strong className="text-slate-700 dark:text-slate-300">{event.actor}</strong> ({event.actorRole})
                      </div>

                      {event.note && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl mt-1 border border-slate-100 dark:border-slate-800">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* APPROVE CAMPAIGN DIALOG (PROMPT 22) */}
      <ApproveCampaignDialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirmApprove={handleConfirmApprove}
        campaignName={campaign.name}
        recipientCount={campaign.recipientCount || 0}
        scheduledAt={campaign.scheduledAt}
      />

      {/* REJECT CAMPAIGN DIALOG (PROMPT 22) */}
      <RejectCampaignDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirmReject={handleConfirmReject}
        campaignName={campaign.name}
      />

      {/* GENERAL CONFIRMATION MODAL */}
      <Dialog open={isConfirmModalOpen} onOpenChange={() => setIsConfirmModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <DialogTitle>
                {modalAction === 'pause'
                  ? 'Tạm Dừng Phân Phối Chiến Dịch?'
                  : modalAction === 'resume'
                  ? 'Tiếp Tục Gửi Chiến Dịch?'
                  : modalAction === 'delete'
                  ? 'Xác Nhận Xóa Chiến Dịch?'
                  : 'Xác Nhận Thao Tác'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Thao tác này sẽ áp dụng thay đổi trạng thái ngay lập tức cho chiến dịch "{campaign.name}".
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              className={
                modalAction === 'delete'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }
              onClick={handleExecuteModalAction}
            >
              Xác Nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CampaignDetailPage
