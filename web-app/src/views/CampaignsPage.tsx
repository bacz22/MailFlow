import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { SimpleSelect } from '../components/ui/Select'
import { MetricWidget } from '../components/dashboard/MetricWidget'
import { CampaignTable } from '../components/campaigns/CampaignTable'
import { ApproveCampaignDialog } from '../components/campaigns/approval/ApproveCampaignDialog'
import { RejectCampaignDialog } from '../components/campaigns/approval/RejectCampaignDialog'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { campaignService } from '../services/campaign.service'
import type { Campaign } from '../types/campaign.types'

export interface CampaignsPageProps {
  onNavigate: (path: string) => void
}

type TabKey = 'ALL' | 'SENDING' | 'SCHEDULED' | 'PENDING_APPROVAL' | 'DRAFT' | 'COMPLETED'

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState<string>('all')
  const [approving, setApproving] = useState<Campaign | null>(null)
  const [rejecting, setRejecting] = useState<Campaign | null>(null)

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await campaignService.list({ q: searchQuery.trim() || undefined })
      setCampaigns(data)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được chiến dịch',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }, [searchQuery, showToast])

  useEffect(() => {
    void loadCampaigns()
  }, [loadCampaigns])

  useEffect(() => {
    const hasActiveSend = campaigns.some(
      (c) => c.status === 'SENDING' || c.status === 'PAUSED' || c.status === 'SCHEDULED'
    )
    if (!hasActiveSend) return
    const timer = window.setInterval(() => {
      void loadCampaigns()
    }, 4000)
    return () => window.clearInterval(timer)
  }, [campaigns, loadCampaigns])

  const tabCounts = {
    ALL: campaigns.length,
    SENDING: campaigns.filter((c) => c.status === 'SENDING' || c.status === 'QUEUED').length,
    SCHEDULED: campaigns.filter((c) => c.status === 'SCHEDULED').length,
    PENDING_APPROVAL: campaigns.filter((c) => c.status === 'PENDING_APPROVAL').length,
    DRAFT: campaigns.filter((c) => c.status === 'DRAFT').length,
    COMPLETED: campaigns.filter((c) => c.status === 'COMPLETED').length,
  }

  const filteredCampaigns = campaigns.filter((c) => {
    // Tab filter
    if (activeTab === 'SENDING' && c.status !== 'SENDING' && c.status !== 'QUEUED') return false
    if (activeTab === 'SCHEDULED' && c.status !== 'SCHEDULED') return false
    if (activeTab === 'PENDING_APPROVAL' && c.status !== 'PENDING_APPROVAL') return false
    if (activeTab === 'DRAFT' && c.status !== 'DRAFT') return false
    if (activeTab === 'COMPLETED' && c.status !== 'COMPLETED') return false

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = c.name.toLowerCase().includes(q)
      const matchSub = c.subject.toLowerCase().includes(q)
      if (!matchName && !matchSub) return false
    }

    // Creator filter
    if (creatorFilter !== 'all' && c.createdBy !== creatorFilter) return false

    return true
  })

  const creatorOptions = useMemo(() => {
    const names = Array.from(new Set(campaigns.map((c) => c.createdBy).filter(Boolean)))
    return [{ value: 'all', label: 'Tất cả người tạo' }, ...names.map((name) => ({ value: name, label: name }))]
  }, [campaigns])

  // Handlers
  const handleApprove = async (note?: string) => {
    if (!approving) return
    try {
      await campaignService.approve(approving.id, note)
      await loadCampaigns()
      showToast({
        type: 'success',
        title: 'Đã phê duyệt chiến dịch',
        description: `Chiến dịch "${approving.name}" đã được phê duyệt sẵn sàng phát hành.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không phê duyệt được',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  const handleReject = async (reason: string) => {
    if (!rejecting) return
    try {
      await campaignService.reject(rejecting.id, reason)
      await loadCampaigns()
      showToast({
        type: 'warning',
        title: 'Đã từ chối chiến dịch',
        description: `Đã từ chối phê duyệt chiến dịch "${rejecting.name}".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không từ chối được',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  const handlePause = async (c: Campaign) => {
    try {
      await campaignService.pause(c.id)
      await loadCampaigns()
      showToast({
        type: 'success',
        title: 'Đã tạm dừng',
        description: `Chiến dịch "${c.name}" đã tạm dừng gửi.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tạm dừng được',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleResume = async (c: Campaign) => {
    try {
      await campaignService.resume(c.id)
      await loadCampaigns()
      showToast({
        type: 'success',
        title: 'Tiếp tục gửi',
        description: `Chiến dịch "${c.name}" đang gửi lại.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tiếp tục được',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleDuplicate = async (c: Campaign) => {
    try {
      const source = await campaignService.get(c.id)
      await campaignService.create({
        name: `${source.name} (Bản sao)`,
        subject: source.subject,
        previewText: source.previewText,
        senderId: source.senderId,
        replyTo: source.replyTo,
        templateId: source.templateId,
        htmlContent: source.htmlContent,
        sendType: source.sendType,
        scheduledAt: source.scheduledAtIso,
        listIds: source.listIds,
        segmentIds: source.segmentIds,
        excludedListIds: source.excludedListIds,
      })
      await loadCampaigns()
      showToast({
        type: 'success',
        title: 'Đã nhân bản chiến dịch',
        description: `Đã tạo bản sao "${source.name} (Bản sao)".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không nhân bản được',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleDelete = async (c: Campaign) => {
    try {
      await campaignService.delete(c.id)
      await loadCampaigns()
      showToast({
        type: 'warning',
        title: 'Đã xóa chiến dịch',
        description: `Đã xóa chiến dịch "${c.name}".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được chiến dịch',
        description: error instanceof ApiError ? error.detail : 'Chỉ xóa được nháp, bị từ chối hoặc đã hủy.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Chiến Dịch Email (Email Campaigns)"
        description="Lập lịch, gửi hàng loạt và theo dõi chỉ số tương tác thời gian thực của các chiến dịch tiếp thị và bản tin định kỳ."
        badge={
          <Badge variant="default" className="text-xs font-mono font-bold">
            {campaigns.length} Chiến Dịch
          </Badge>
        }
        actions={
          <PermissionGate
            permission={PERMISSIONS.CAMPAIGN_CREATE}
            renderDisabled
            disabledTooltip="Bạn không có quyền tạo chiến dịch (CAMPAIGN_CREATE)"
          >
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('/campaigns/create')}
            >
              Tạo Chiến Dịch Mới
            </Button>
          </PermissionGate>
        }
      />

      {/* READONLY BANNER */}
      <ReadOnlyBanner resourceName="danh sách chiến dịch" />

      {/* 2. Top Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Tổng Chiến Dịch"
          value={String(campaigns.length)}
          change=""
          trend="neutral"
          sparklineData={[0, 0, 0, 0, 0, 0, campaigns.length]}
          trendLabel="Trong workspace"
        />
        <MetricWidget
          label="Bản Nháp"
          value={String(tabCounts.DRAFT)}
          change=""
          trend="neutral"
          sparklineData={[0, 0, 0, 0, 0, 0, tabCounts.DRAFT]}
          trendLabel="Chưa gửi duyệt"
        />
        <MetricWidget
          label="Chờ Phê Duyệt"
          value={String(tabCounts.PENDING_APPROVAL)}
          change=""
          trend="neutral"
          sparklineData={[0, 0, 0, 0, 0, 0, tabCounts.PENDING_APPROVAL]}
          trendLabel="Cần Admin duyệt"
        />
        <MetricWidget
          label="Đã Duyệt / Lên Lịch"
          value={String(
            campaigns.filter((c) => c.status === 'APPROVED' || c.status === 'SCHEDULED').length
          )}
          change=""
          trend="neutral"
          sparklineData={[0, 0, 0, 0, 0, 0, 0]}
          trendLabel="Gửi hàng loạt chưa bật"
        />
      </div>

      {/* 3. Status Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { key: 'ALL', label: 'Tất Cả', count: tabCounts.ALL },
          { key: 'SENDING', label: 'Đang Gửi', count: tabCounts.SENDING },
          { key: 'SCHEDULED', label: 'Đã Lên Lịch', count: tabCounts.SCHEDULED },
          { key: 'PENDING_APPROVAL', label: 'Chờ Phê Duyệt', count: tabCounts.PENDING_APPROVAL },
          { key: 'DRAFT', label: 'Bản Nháp', count: tabCounts.DRAFT },
          { key: 'COMPLETED', label: 'Hoàn Thành', count: tabCounts.COMPLETED },
        ].map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 4. Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm theo tên chiến dịch hoặc dòng tiêu đề email..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-48">
          <SimpleSelect
            size="sm"
            value={creatorFilter}
            onValueChange={(val) => setCreatorFilter(val)}
            options={creatorOptions}
          />
        </div>
      </div>

      {/* 5. Realtime Campaigns Table */}
      <CampaignTable
        campaigns={filteredCampaigns}
        onViewCampaign={(c) => onNavigate(`/campaigns/${c.id}`)}
        onEditCampaign={(c) => onNavigate(`/campaigns/${c.id}/edit`)}
        onDuplicateCampaign={handleDuplicate}
        onApproveCampaign={(c) => setApproving(c)}
        onRejectCampaign={(c) => setRejecting(c)}
        onPauseCampaign={handlePause}
        onResumeCampaign={handleResume}
        onDeleteCampaign={handleDelete}
        onViewReport={(c) => onNavigate(`/campaigns/${c.id}/report`)}
      />

      <ApproveCampaignDialog
        isOpen={!!approving}
        onClose={() => setApproving(null)}
        onConfirmApprove={handleApprove}
        campaignName={approving?.name || ''}
        recipientCount={approving?.recipientCount || 0}
        scheduledAt={approving?.scheduledAt}
      />
      <RejectCampaignDialog
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        onConfirmReject={handleReject}
        campaignName={rejecting?.name || ''}
      />
    </div>
  )
}

export default CampaignsPage
