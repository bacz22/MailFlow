import React, { useState } from 'react'
import {
  Mail,
  Layers,
  Sparkles,
  Inbox,
} from 'lucide-react'
import { CampaignStatusBadge } from './CampaignStatusBadge'
import { CampaignRowActions } from './CampaignRowActions'
import { Pagination } from '../ui/Pagination'
import type { Campaign } from '../../types/campaign.types'

export interface CampaignTableProps {
  campaigns: Campaign[]
  onViewCampaign: (campaign: Campaign) => void
  onEditCampaign: (campaign: Campaign) => void
  onDuplicateCampaign: (campaign: Campaign) => void
  onApproveCampaign?: (campaign: Campaign) => void
  onRejectCampaign?: (campaign: Campaign) => void
  onPauseCampaign?: (campaign: Campaign) => void
  onResumeCampaign?: (campaign: Campaign) => void
  onDeleteCampaign?: (campaign: Campaign) => void
  onViewReport?: (campaign: Campaign) => void
  defaultPageSize?: number
  pageSizeOptions?: number[]
}

export const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onViewCampaign,
  onEditCampaign,
  onDuplicateCampaign,
  onApproveCampaign,
  onRejectCampaign,
  onPauseCampaign,
  onResumeCampaign,
  onDeleteCampaign,
  onViewReport,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  if (campaigns.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-12 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <Inbox className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy chiến dịch nào
          </h3>
          <p className="text-xs text-slate-400">
            Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
          </p>
        </div>
      </div>
    )
  }

  const totalItems = campaigns.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedCampaigns = campaigns.slice(startIndex, startIndex + pageSize)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
            <tr>
              <th className="py-3 px-4 min-w-[240px]">Tên Chiến Dịch & Tiêu Đề</th>
              <th className="py-3 px-3">Trạng Thái</th>
              <th className="py-3 px-3">Đối Tượng Nhận</th>
              <th className="py-3 px-3 text-right">Quy Mô</th>
              <th className="py-3 px-3 text-right">Đã Gửi</th>
              <th className="py-3 px-3 min-w-[100px]">Tỷ Lệ Mở</th>
              <th className="py-3 px-3 min-w-[100px]">Tỷ Lệ Click</th>
              <th className="py-3 px-3">Lịch Gửi</th>
              <th className="py-3 px-3">Người Tạo</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedCampaigns.map((c) => {
              const deliveryPercent =
                c.recipientCount > 0 ? Math.round((c.sentCount / c.recipientCount) * 100) : 0

              return (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition cursor-pointer group"
                  onClick={() => onViewCampaign(c)}
                >
                  {/* Campaign Name & Subject */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200 dark:border-blue-800">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                          {c.subject}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    <CampaignStatusBadge status={c.status} />
                  </td>

                  {/* Audience */}
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {c.audienceType === 'segment' ? (
                        <Sparkles className="w-3 h-3 text-violet-500" />
                      ) : (
                        <Layers className="w-3 h-3 text-emerald-500" />
                      )}
                      <span>{c.audienceName}</span>
                    </span>
                  </td>

                  {/* Recipients */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {c.recipientCount.toLocaleString()}
                  </td>

                  {/* Sent Count & Progress */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {c.sentCount.toLocaleString()}
                    </div>
                    {c.status === 'SENDING' && (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          style={{ width: `${deliveryPercent}%` }}
                          className="h-full bg-blue-600 rounded-full animate-pulse"
                        />
                      </div>
                    )}
                  </td>

                  {/* Open Rate */}
                  <td className="py-3.5 px-3">
                    {c.status === 'COMPLETED' || c.status === 'SENDING' ? (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {c.openRate}%
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">-</span>
                    )}
                  </td>

                  {/* Click Rate */}
                  <td className="py-3.5 px-3">
                    {c.status === 'COMPLETED' || c.status === 'SENDING' ? (
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {c.clickRate}%
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">-</span>
                    )}
                  </td>

                  {/* Schedule */}
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                    {c.scheduledAt || c.sentAt || c.createdAt}
                  </td>

                  {/* Created By */}
                  <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                    {c.createdBy}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <CampaignRowActions
                      campaign={c}
                      onView={onViewCampaign}
                      onEdit={onEditCampaign}
                      onDuplicate={onDuplicateCampaign}
                      onApprove={onApproveCampaign}
                      onReject={onRejectCampaign}
                      onPause={onPauseCampaign}
                      onResume={onResumeCampaign}
                      onDelete={onDeleteCampaign}
                      onViewReport={onViewReport}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        itemLabel="chiến dịch"
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />
    </div>
  )
}

export default CampaignTable
