import React, { useState } from 'react'
import {
  Layers,
  Plus,
  Search,
  Users,
  Calendar,
  MoreVertical,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Tag,
  LayoutGrid,
  List as ListIcon,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { TagManagerModal, ACCESSIBLE_TAG_COLORS } from '../components/lists/TagManagerModal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/DropdownMenu'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { ReadOnlyBanner } from '../components/ui/ReadOnlyBanner'
import { useToast } from '../components/ui/Toast'
import type { AudienceList, AudienceTag } from '../types/list.types'

const INITIAL_LISTS: AudienceList[] = [
  {
    id: 'lst-1',
    name: 'VIP Enterprise Clients',
    description: 'Khách hàng doanh nghiệp trọng điểm gói hợp đồng trên $5,000/năm.',
    contactCount: 5420,
    activeCount: 5380,
    unsubscribedCount: 12,
    createdAt: '10/08/2026',
    updatedAt: '25/08/2026',
    tags: ['Customer', 'High Value', 'Decision Maker'],
  },
  {
    id: 'lst-2',
    name: 'Webinar Leads Q3',
    description: 'Danh sách đăng ký tham dự chuỗi hội thảo trực tuyến Tối ưu Inbox Rate 2026.',
    contactCount: 3850,
    activeCount: 3790,
    unsubscribedCount: 18,
    createdAt: '15/08/2026',
    updatedAt: '24/08/2026',
    tags: ['Lead', 'Engaged'],
  },
  {
    id: 'lst-3',
    name: 'General Newsletter Subscribers',
    description: 'Độc giả nhận bản tin kiến thức email marketing và tự động hóa hàng tuần.',
    contactCount: 8900,
    activeCount: 8650,
    unsubscribedCount: 45,
    createdAt: '01/08/2026',
    updatedAt: '25/08/2026',
    tags: ['Newsletter'],
  },
  {
    id: 'lst-4',
    name: '14-Day Free Trial Users',
    description: 'Người dùng mới đăng ký tài khoản trải nghiệm nền tảng trong 14 ngày qua.',
    contactCount: 1240,
    activeCount: 1210,
    unsubscribedCount: 4,
    createdAt: '18/08/2026',
    updatedAt: '25/08/2026',
    tags: ['Trial', 'Lead'],
  },
]

const INITIAL_TAGS: AudienceTag[] = [
  { id: 'tag-1', name: 'Customer', color: ACCESSIBLE_TAG_COLORS[0].value, contactCount: 5420, createdAt: '01/08/2026' },
  { id: 'tag-2', name: 'High Value', color: ACCESSIBLE_TAG_COLORS[1].value, contactCount: 2150, createdAt: '05/08/2026' },
  { id: 'tag-3', name: 'Lead', color: ACCESSIBLE_TAG_COLORS[2].value, contactCount: 4890, createdAt: '10/08/2026' },
  { id: 'tag-4', name: 'Decision Maker', color: ACCESSIBLE_TAG_COLORS[3].value, contactCount: 1820, createdAt: '12/08/2026' },
  { id: 'tag-5', name: 'Engaged', color: ACCESSIBLE_TAG_COLORS[4].value, contactCount: 3400, createdAt: '15/08/2026' },
  { id: 'tag-6', name: 'Trial', color: ACCESSIBLE_TAG_COLORS[5].value, contactCount: 1240, createdAt: '18/08/2026' },
]

export interface ListsPageProps {
  onNavigate: (path: string) => void
}

export const ListsPage: React.FC<ListsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const [lists, setLists] = useState<AudienceList[]>(INITIAL_LISTS)
  const [tags, setTags] = useState<AudienceTag[]>(INITIAL_TAGS)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)

  const filteredLists = lists.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDuplicate = (list: AudienceList) => {
    const duplicated: AudienceList = {
      ...list,
      id: `lst-${Date.now()}`,
      name: `${list.name} (Bản sao)`,
      createdAt: 'Hôm nay',
      updatedAt: 'Hôm nay',
    }
    setLists((prev) => [duplicated, ...prev])
    showToast({
      type: 'success',
      title: 'Đã nhân bản danh sách',
      description: `Đã tạo bản sao "${duplicated.name}".`,
    })
  }

  const handleDelete = (id: string, name: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id))
    showToast({
      type: 'warning',
      title: 'Đã xóa danh sách',
      description: `Đã xóa danh sách "${name}".`,
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Danh Sách Gửi (Audience Lists)"
        description="Tổ chức các tập hợp người nhận theo chiến dịch, nguồn đăng ký và phân khúc khách hàng."
        badge={
          <Badge variant="default" className="text-xs font-mono font-bold">
            {lists.length} Danh Sách
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tag Management Button */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Tag className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={() => setIsTagModalOpen(true)}
            >
              Quản Lý Thẻ ({tags.length})
            </Button>

            {/* Create List Button */}
            <PermissionGate
              permission={PERMISSIONS.LIST_CREATE}
              renderDisabled
              disabledTooltip="Bạn không có quyền tạo danh sách (LIST_CREATE)"
            >
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('/lists/create')}
              >
                Tạo Danh Sách
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* READONLY BANNER */}
      <ReadOnlyBanner resourceName="danh sách người nhận" />

      {/* 2. Top Tag Chips Showcase */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between gap-3 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-2 shrink-0">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Thẻ Phổ Biến:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {tags.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${t.color}`}
            >
              <span>#{t.name}</span>
              <span className="opacity-70 text-[10px] font-mono">({t.contactCount})</span>
            </span>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 dark:text-blue-400 shrink-0"
          onClick={() => setIsTagModalOpen(true)}
        >
          Chỉnh Sửa
        </Button>
      </div>

      {/* 3. Search Toolbar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm kiếm danh sách..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng Lưới (Grid Cards)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng Bảng (Table)"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. LISTS RENDER: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLists.map((list) => (
            <Card
              key={list.id}
              className="hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between border-slate-200/90 dark:border-slate-800/90"
              onClick={() => onNavigate(`/lists/${list.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {list.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-1 mt-0.5">
                        {list.description}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuItem onClick={() => onNavigate(`/lists/${list.id}`)}>
                          <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                          <span>Xem chi tiết & danh bạ</span>
                        </DropdownMenuItem>
                        <PermissionGate permission={PERMISSIONS.LIST_UPDATE}>
                          <DropdownMenuItem onClick={() => onNavigate(`/lists/${list.id}/edit`)}>
                            <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                            <span>Chỉnh sửa tên danh sách</span>
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate permission={PERMISSIONS.LIST_CREATE}>
                          <DropdownMenuItem onClick={() => handleDuplicate(list)}>
                            <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                            <span>Nhân bản danh sách</span>
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate permission={PERMISSIONS.LIST_DELETE}>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(list.id, list.name)}
                            className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            <span>Xóa danh sách</span>
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Stats Counter Bar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-400 font-semibold">Quy Mô Người Nhận</span>
                    <div className="text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{list.contactCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {list.activeCount.toLocaleString()} Active
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {list.unsubscribedCount} hủy nhận tin
                    </div>
                  </div>
                </div>

                {/* Tags attached to list */}
                {list.tags && list.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {list.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dates & Quick Enter */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Tạo: {list.createdAt}</span>
                  </div>

                  <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                    <span>Mở danh bạ</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 5. LISTS RENDER: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Tên Danh Sách</th>
                  <th className="py-3 px-3 text-right">Tổng Liên Hệ</th>
                  <th className="py-3 px-3 text-right">Đang Nhận Tin</th>
                  <th className="py-3 px-3">Thẻ Gắn Liền</th>
                  <th className="py-3 px-3">Ngày Tạo</th>
                  <th className="py-3 px-3">Cập Nhật</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLists.map((list) => (
                  <tr
                    key={list.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition cursor-pointer"
                    onClick={() => onNavigate(`/lists/${list.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{list.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{list.description}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {list.contactCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      {list.activeCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs">
                        {list.tags?.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{list.createdAt}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{list.updatedAt}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/lists/${list.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tag Manager Dialog */}
      <TagManagerModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={tags}
        onUpdateTags={setTags}
      />
    </div>
  )
}

export default ListsPage
