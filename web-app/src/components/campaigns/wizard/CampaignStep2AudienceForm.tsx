import React, { useState } from 'react'
import {
  Users,
  Search,
  Check,
  MinusCircle,
  ShieldCheck,
  Layers,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card'
import type { CampaignStep2Audience } from '../../../types/campaignWizard.types'

export interface CampaignStep2AudienceFormProps {
  data: CampaignStep2Audience
  onChange: (data: Partial<CampaignStep2Audience>) => void
}

interface AvailableAudienceItem {
  id: string
  name: string
  type: 'list' | 'segment'
  count: number
  description: string
}

const AVAILABLE_LISTS: AvailableAudienceItem[] = [
  {
    id: 'lst-1',
    name: 'VIP Enterprise Clients',
    type: 'list',
    count: 5420,
    description: 'Khách hàng doanh nghiệp trọng điểm hợp đồng trên $5,000/năm.',
  },
  {
    id: 'lst-2',
    name: 'Webinar Leads Q3',
    type: 'list',
    count: 3850,
    description: 'Người đăng ký tham gia chuỗi hội thảo Inbox Rate 2026.',
  },
  {
    id: 'lst-3',
    name: 'General Newsletter Subscribers',
    type: 'list',
    count: 8900,
    description: 'Độc giả bản tin công nghệ và marketing hàng tuần.',
  },
  {
    id: 'lst-4',
    name: '14-Day Free Trial Users',
    type: 'list',
    count: 1240,
    description: 'Tài khoản dùng thử trải nghiệm 14 ngày qua.',
  },
]

const AVAILABLE_SEGMENTS: AvailableAudienceItem[] = [
  {
    id: 'seg-1',
    name: 'Khách Hàng Doanh Nghiệp VIP (Hà Nội)',
    type: 'segment',
    count: 2315,
    description: 'Lọc tự động: Thành phố = Hà Nội AND Tag contains "VIP".',
  },
  {
    id: 'seg-2',
    name: 'Tương Tác Cao (Engagement Score > 80)',
    type: 'segment',
    count: 4120,
    description: 'Người nhận có điểm tương tác mở và click link cao nhất.',
  },
  {
    id: 'seg-3',
    name: 'Leads Mới Đăng Ký (Trong 14 Ngày)',
    type: 'segment',
    count: 890,
    description: 'Liên hệ mới tạo trong vòng 14 ngày cần chuỗi chào mừng.',
  },
  {
    id: 'seg-4',
    name: 'Khách Hàng Nguy Cơ Rời Bỏ (Churn Risk)',
    type: 'segment',
    count: 650,
    description: 'Không mở email trong hơn 60 ngày qua.',
  },
]

export const CampaignStep2AudienceForm: React.FC<CampaignStep2AudienceFormProps> = ({
  data,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'segments'>('lists')
  const [searchQuery, setSearchQuery] = useState('')
  const [isExcludeExpanded, setIsExcludeExpanded] = useState(false)

  // Filtered available items
  const filteredLists = AVAILABLE_LISTS.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSegments = AVAILABLE_SEGMENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Toggle Include List
  const handleToggleList = (id: string) => {
    const isSelected = data.selectedListIds.includes(id)
    const newSelected = isSelected
      ? data.selectedListIds.filter((item) => item !== id)
      : [...data.selectedListIds, id]

    calculateEstimated(newSelected, data.selectedSegmentIds, data.excludedListIds)
  }

  // Toggle Include Segment
  const handleToggleSegment = (id: string) => {
    const isSelected = data.selectedSegmentIds.includes(id)
    const newSelected = isSelected
      ? data.selectedSegmentIds.filter((item) => item !== id)
      : [...data.selectedSegmentIds, id]

    calculateEstimated(data.selectedListIds, newSelected, data.excludedListIds)
  }

  // Toggle Exclude
  const handleToggleExclude = (id: string) => {
    const isExcluded = data.excludedListIds.includes(id)
    const newExcluded = isExcluded
      ? data.excludedListIds.filter((item) => item !== id)
      : [...data.excludedListIds, id]

    calculateEstimated(data.selectedListIds, data.selectedSegmentIds, newExcluded)
  }

  // Calculate unique estimated count with deduplication mock
  const calculateEstimated = (listIds: string[], segIds: string[], excludeIds: string[]) => {
    let rawTotal = 0

    listIds.forEach((id) => {
      const match = AVAILABLE_LISTS.find((l) => l.id === id)
      if (match) rawTotal += match.count
    })

    segIds.forEach((id) => {
      const match = AVAILABLE_SEGMENTS.find((s) => s.id === id)
      if (match) rawTotal += match.count
    })

    // Deduplicate overlap ~15% if multiple groups selected
    let deduplicated = rawTotal > 0 ? Math.round(rawTotal * 0.85) : 0

    // Subtract excluded
    excludeIds.forEach((id) => {
      const match =
        AVAILABLE_LISTS.find((l) => l.id === id) || AVAILABLE_SEGMENTS.find((s) => s.id === id)
      if (match) deduplicated = Math.max(0, deduplicated - Math.round(match.count * 0.4))
    })

    onChange({
      selectedListIds: listIds,
      selectedSegmentIds: segIds,
      excludedListIds: excludeIds,
      estimatedRecipients: deduplicated,
    })
  }

  const selectedLists = AVAILABLE_LISTS.filter((l) => data.selectedListIds.includes(l.id))
  const selectedSegments = AVAILABLE_SEGMENTS.filter((s) => data.selectedSegmentIds.includes(s.id))
  const excludedItems = [...AVAILABLE_LISTS, ...AVAILABLE_SEGMENTS].filter((item) =>
    data.excludedListIds.includes(item.id)
  )

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Top Card: Selection & Exclusions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Audience Selector (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base">Chọn Nguồn Người Nhận</CardTitle>
                </div>

                {/* Tabs Switcher: Lists vs Segments */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('lists')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'lists'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Danh Sách ({data.selectedListIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('segments')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'segments'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Phân Đoạn ({data.selectedSegmentIds.length})</span>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-4">
              {/* Search in Tab */}
              <Input
                placeholder={
                  activeTab === 'lists'
                    ? 'Tìm kiếm theo tên danh sách gửi...'
                    : 'Tìm kiếm theo tên phân đoạn động...'
                }
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* LISTS SELECTION */}
              {activeTab === 'lists' && (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {filteredLists.map((list) => {
                    const isSelected = data.selectedListIds.includes(list.id)

                    return (
                      <div
                        key={list.id}
                        onClick={() => handleToggleList(list.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs cursor-pointer select-none ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>

                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {list.name}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {list.description}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {list.count.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">liên hệ</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* SEGMENTS SELECTION */}
              {activeTab === 'segments' && (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {filteredSegments.map((seg) => {
                    const isSelected = data.selectedSegmentIds.includes(seg.id)

                    return (
                      <div
                        key={seg.id}
                        onClick={() => handleToggleSegment(seg.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs cursor-pointer select-none ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/40 dark:bg-violet-950/20 ring-2 ring-violet-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>

                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{seg.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[9px] font-bold uppercase">
                                Realtime
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {seg.description}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {seg.count.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">liên hệ</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional Exclude Audience Box */}
          <Card>
            <CardHeader
              className="py-3 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
              onClick={() => setIsExcludeExpanded(!isExcludeExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MinusCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tùy Chọn Loại Trừ (Exclude Audience)
                  </span>
                  {data.excludedListIds.length > 0 && (
                    <Badge variant="default" className="text-[10px] bg-rose-500">
                      Loại trừ {data.excludedListIds.length} nhóm
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-blue-600 font-semibold">
                  {isExcludeExpanded ? 'Thu gọn' : 'Mở rộng'}
                </span>
              </div>
            </CardHeader>

            {isExcludeExpanded && (
              <CardContent className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">
                  Chọn các danh sách hoặc phân đoạn bạn muốn <strong>loại trừ tuyệt đối</strong> khỏi đợt gửi này:
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[...AVAILABLE_LISTS, ...AVAILABLE_SEGMENTS].map((item) => {
                    const isExcluded = data.excludedListIds.includes(item.id)

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleExclude(item.id)}
                        className={`p-2.5 rounded-xl border transition flex items-center justify-between text-xs cursor-pointer select-none ${
                          isExcluded
                            ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <span className="font-semibold">{item.name}</span>
                        <span className="font-mono text-[11px] opacity-80">
                          -{item.count.toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column: Selected Summary & Deduplication Realtime Box (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Estimated Unique Audience Card */}
          <Card className="border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/30 to-transparent">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base">Tổng Người Nhận Ước Tính</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900 text-center space-y-1 shadow-xs">
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {data.estimatedRecipients.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Liên Hệ Độc Bản (Unique Recipients)
                </div>
                <div className="text-[11px] text-slate-400">
                  Đã tự động khử trùng lặp qua thuật toán Deduplication
                </div>
              </div>

              {/* Selected Breakdown List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Các Nhóm Đã Chỉ Định:
                </div>

                {selectedLists.length === 0 && selectedSegments.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                    Chưa chọn danh sách hoặc phân đoạn nào.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedLists.map((l) => (
                      <div
                        key={l.id}
                        className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-blue-900 dark:text-blue-200 truncate">
                          {l.name}
                        </span>
                        <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300 font-bold shrink-0">
                          {l.count.toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {selectedSegments.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-violet-900 dark:text-violet-200 truncate">
                          {s.name}
                        </span>
                        <span className="font-mono text-[11px] text-violet-700 dark:text-violet-300 font-bold shrink-0">
                          {s.count.toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {excludedItems.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-rose-900 dark:text-rose-200 truncate">
                          [Loại trừ] {ex.name}
                        </span>
                        <span className="font-mono text-[11px] text-rose-700 dark:text-rose-300 font-bold shrink-0">
                          -{ex.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deduplication explanation note */}
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                💡 <strong>Thuật toán Deduplication:</strong> Nếu một khách hàng nằm trong cả 2 danh sách được chọn, MailFlow sẽ tự động gộp và chỉ gửi đúng 1 email duy nhất.
              </div>
            </CardContent>
          </Card>

          {/* Suppression List & Anti-Spam Compliance Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bảo Vệ Tuân Thủ & Tự Động Loại Bỏ (Suppression List)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Mọi liên hệ đã <strong>Hủy Nhận Tin (Unsubscribed theo chuẩn RFC 8058)</strong> hoặc gặp lỗi hỏng hòm thư (Bounced / Invalid Email) sẽ được tự động lọc bỏ và <strong>tuyệt đối không nhận email</strong> từ hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignStep2AudienceForm
