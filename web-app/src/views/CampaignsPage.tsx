import React, { useState } from 'react'
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
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import type { Campaign } from '../types/campaign.types'

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-1',
    name: 'Bản Tin Công Nghệ & AI Hàng Tuần #48',
    subject: '🔥 Khám phá 5 mẹo tối ưu hóa hạ tầng gửi thư với RFC 8058',
    status: 'SENDING',
    audienceName: 'Newsletter Subscribers',
    audienceType: 'list',
    recipientCount: 8900,
    sentCount: 6420,
    openRate: 48.2,
    clickRate: 15.4,
    sentAt: '25/08/2026 09:30',
    createdBy: 'Trần Minh Marketing',
    createdAt: '24/08/2026',
    updatedAt: '25/08/2026',
  },
  {
    id: 'cmp-2',
    name: 'Chiến Dịch Ra Mắt Tính Năng Mới Q3',
    subject: '🚀 Trải nghiệm MailFlow 2.0: Tự động hóa phân đoạn thông minh',
    status: 'SCHEDULED',
    audienceName: 'VIP Enterprise Clients',
    audienceType: 'list',
    recipientCount: 5420,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    scheduledAt: '28/08/2026 08:00',
    createdBy: 'Nguyễn Văn Editor',
    createdAt: '22/08/2026',
    updatedAt: '25/08/2026',
  },
  {
    id: 'cmp-3',
    name: 'Chuỗi Email Nuôi Dưỡng Khách Hàng Dùng Thử',
    subject: '3 bước để thiết lập tên miền gửi thư bảo mật 100% DKIM',
    status: 'COMPLETED',
    audienceName: '14-Day Free Trial Users',
    audienceType: 'list',
    recipientCount: 1240,
    sentCount: 1240,
    openRate: 52.8,
    clickRate: 21.1,
    sentAt: '20/08/2026 14:00',
    createdBy: 'Nguyễn Văn Editor',
    createdAt: '19/08/2026',
    updatedAt: '20/08/2026',
  },
  {
    id: 'cmp-4',
    name: 'Chiến Dịch Khuyến Mãi Flash Sale Tháng 8',
    subject: '⚡ Giảm ngay 30% khi gia hạn gói Doanh Nghiệp trong 48h',
    status: 'PENDING_APPROVAL',
    audienceName: 'Khách Hàng Doanh Nghiệp VIP (Hà Nội)',
    audienceType: 'segment',
    recipientCount: 2315,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    scheduledAt: '26/08/2026 10:00',
    createdBy: 'Lê Hoàng Content',
    createdAt: '24/08/2026',
    updatedAt: '25/08/2026',
  },
  {
    id: 'cmp-5',
    name: 'Thư Cảm Ơn Tham Gia Hội Thảo Trực Tuyến',
    subject: 'Tài liệu tổng hợp & Bản ghi video Webinar Tối ưu Inbox Rate 2026',
    status: 'COMPLETED',
    audienceName: 'Webinar Leads Q3',
    audienceType: 'list',
    recipientCount: 3850,
    sentCount: 3850,
    openRate: 64.5,
    clickRate: 28.7,
    sentAt: '16/08/2026 15:30',
    createdBy: 'Trần Minh Marketing',
    createdAt: '15/08/2026',
    updatedAt: '16/08/2026',
  },
  {
    id: 'cmp-6',
    name: 'Tái Kích Hoạt Tài Khoản Ngưng Tương Tác',
    subject: 'Chúng tôi có thể hỗ trợ gì thêm cho doanh nghiệp của bạn?',
    status: 'DRAFT',
    audienceName: 'Khách Hàng Có Nguy Cơ Rời Bỏ (Churn Risk)',
    audienceType: 'segment',
    recipientCount: 650,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdBy: 'Lê Hoàng Content',
    createdAt: '25/08/2026',
    updatedAt: '25/08/2026',
  },
]

export interface CampaignsPageProps {
  onNavigate: (path: string) => void
}

type TabKey = 'ALL' | 'SENDING' | 'SCHEDULED' | 'PENDING_APPROVAL' | 'DRAFT' | 'COMPLETED'

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS)
  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState<string>('all')

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

  // Handlers
  const handleApprove = (c: Campaign) => {
    setCampaigns((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, status: 'APPROVED' } : item))
    )
    showToast({
      type: 'success',
      title: 'Đã phê duyệt chiến dịch',
      description: `Chiến dịch "${c.name}" đã được phê duyệt sẵn sàng phát hành.`,
    })
  }

  const handleReject = (c: Campaign) => {
    setCampaigns((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, status: 'REJECTED' } : item))
    )
    showToast({
      type: 'warning',
      title: 'Đã từ chối chiến dịch',
      description: `Đã từ chối phê duyệt chiến dịch "${c.name}".`,
    })
  }

  const handlePause = (c: Campaign) => {
    setCampaigns((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, status: 'PAUSED' } : item))
    )
    showToast({
      type: 'warning',
      title: 'Đã tạm dừng gửi',
      description: `Đã tạm hoãn tiến trình gửi của chiến dịch "${c.name}".`,
    })
  }

  const handleResume = (c: Campaign) => {
    setCampaigns((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, status: 'SENDING' } : item))
    )
    showToast({
      type: 'success',
      title: 'Đã tiếp tục gửi',
      description: `Chiến dịch "${c.name}" đang tiếp tục gửi đến các người nhận còn lại.`,
    })
  }

  const handleDuplicate = (c: Campaign) => {
    const duplicated: Campaign = {
      ...c,
      id: `cmp-${Date.now()}`,
      name: `${c.name} (Bản sao)`,
      status: 'DRAFT',
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      createdAt: 'Hôm nay',
      updatedAt: 'Hôm nay',
    }
    setCampaigns((prev) => [duplicated, ...prev])
    showToast({
      type: 'success',
      title: 'Đã nhân bản chiến dịch',
      description: `Đã tạo bản sao "${duplicated.name}".`,
    })
  }

  const handleDelete = (c: Campaign) => {
    setCampaigns((prev) => prev.filter((item) => item.id !== c.id))
    showToast({
      type: 'warning',
      title: 'Đã xóa chiến dịch',
      description: `Đã xóa chiến dịch "${c.name}".`,
    })
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
          label="Tổng Chiến Dịch Đã Gửi"
          value="142,850"
          change="+18.4%"
          trend="up"
          sparklineData={[12, 18, 25, 30, 42, 58, 72]}
          trendLabel="30 ngày qua"
        />
        <MetricWidget
          label="Tỷ Lệ Mở Trung Bình"
          value="48.6%"
          change="+3.2%"
          trend="up"
          sparklineData={[42, 45, 44, 46, 47, 48, 49]}
          trendLabel="Top 5% ngành SaaS"
        />
        <MetricWidget
          label="Tỷ Lệ Click (CTR)"
          value="16.4%"
          change="+1.8%"
          trend="up"
          sparklineData={[11, 12, 13, 14, 15, 16, 17]}
          trendLabel="Tỷ lệ nhấp chuột"
        />
        <MetricWidget
          label="Tỷ Lệ Bounces / Lỗi"
          value="0.18%"
          change="-0.05%"
          trend="down"
          sparklineData={[0.3, 0.28, 0.25, 0.22, 0.2, 0.19, 0.18]}
          trendLabel="Chuẩn bảo mật cao"
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
            options={[
              { value: 'all', label: 'Tất cả người tạo' },
              { value: 'Trần Minh Marketing', label: 'Trần Minh Marketing' },
              { value: 'Nguyễn Văn Editor', label: 'Nguyễn Văn Editor' },
              { value: 'Lê Hoàng Content', label: 'Lê Hoàng Content' },
            ]}
          />
        </div>
      </div>

      {/* 5. Realtime Campaigns Table */}
      <CampaignTable
        campaigns={filteredCampaigns}
        onViewCampaign={(c) => onNavigate(`/campaigns/${c.id}`)}
        onEditCampaign={(c) => onNavigate(`/campaigns/${c.id}/edit`)}
        onDuplicateCampaign={handleDuplicate}
        onApproveCampaign={handleApprove}
        onRejectCampaign={handleReject}
        onPauseCampaign={handlePause}
        onResumeCampaign={handleResume}
        onDeleteCampaign={handleDelete}
        onViewReport={(c) => onNavigate(`/campaigns/${c.id}/report`)}
      />
    </div>
  )
}

export default CampaignsPage
