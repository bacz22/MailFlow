import React, { useState } from 'react'
import {
  Layers,
  Plus,
  Search,
  Users,
  MoreVertical,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Filter,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
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
import type { DynamicSegment } from '../types/segment.types'

const INITIAL_SEGMENTS: DynamicSegment[] = [
  {
    id: 'seg-1',
    name: 'Khách Hàng Doanh Nghiệp VIP (Hà Nội)',
    description: 'Tự động lọc các liên hệ tại khu vực Hà Nội có gắn thẻ VIP và trạng thái Active.',
    matchLogic: 'and',
    conditions: [
      { id: 'c-1', field: 'city', operator: 'equals', value: 'Hà Nội', fieldType: 'string' },
      { id: 'c-2', field: 'tags', operator: 'contains', value: 'VIP', fieldType: 'tag' },
      { id: 'c-3', field: 'status', operator: 'equals', value: 'active', fieldType: 'status' },
    ],
    contactCount: 2315,
    createdAt: '12/08/2026',
    updatedAt: '25/08/2026',
  },
  {
    id: 'seg-2',
    name: 'Tương Tác Cao (High Engagement Score > 80)',
    description: 'Người nhận có điểm tương tác mở và click link thường xuyên trong 30 ngày qua.',
    matchLogic: 'and',
    conditions: [
      { id: 'c-4', field: 'engagement_score', operator: 'greater_than', value: '80', fieldType: 'number' },
      { id: 'c-5', field: 'status', operator: 'equals', value: 'active', fieldType: 'status' },
    ],
    contactCount: 4120,
    createdAt: '15/08/2026',
    updatedAt: '24/08/2026',
  },
  {
    id: 'seg-3',
    name: 'Leads Mới Đăng Ký (Trong 14 Ngày Qua)',
    description: 'Người dùng mới đăng ký vào hệ thống cần nuôi dưỡng theo chuỗi tự động hóa.',
    matchLogic: 'and',
    conditions: [
      { id: 'c-6', field: 'created_at', operator: 'in_the_last_days', value: '14', fieldType: 'date' },
    ],
    contactCount: 890,
    createdAt: '18/08/2026',
    updatedAt: '25/08/2026',
  },
  {
    id: 'seg-4',
    name: 'Khách Hàng Có Nguy Cơ Rời Bỏ (Churn Risk)',
    description: 'Liên hệ không mở bất kỳ email nào trong hơn 60 ngày qua.',
    matchLogic: 'or',
    conditions: [
      { id: 'c-7', field: 'tags', operator: 'contains', value: 'Inactive', fieldType: 'tag' },
      { id: 'c-8', field: 'engagement_score', operator: 'less_than', value: '20', fieldType: 'number' },
    ],
    contactCount: 650,
    createdAt: '20/08/2026',
    updatedAt: '25/08/2026',
  },
]

export interface SegmentsPageProps {
  onNavigate: (path: string) => void
}

export const SegmentsPage: React.FC<SegmentsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const [segments, setSegments] = useState<DynamicSegment[]>(INITIAL_SEGMENTS)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSegments = segments.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDuplicate = (seg: DynamicSegment) => {
    const duplicated: DynamicSegment = {
      ...seg,
      id: `seg-${Date.now()}`,
      name: `${seg.name} (Bản sao)`,
      createdAt: 'Hôm nay',
      updatedAt: 'Hôm nay',
    }
    setSegments((prev) => [duplicated, ...prev])
    showToast({
      type: 'success',
      title: 'Đã nhân bản phân đoạn',
      description: `Đã tạo "${duplicated.name}".`,
    })
  }

  const handleDelete = (id: string, name: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id))
    showToast({
      type: 'warning',
      title: 'Đã xóa phân đoạn',
      description: `Đã xóa phân đoạn "${name}".`,
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Phân Đoạn Động (Dynamic Segments)"
        description="Tự động gom nhóm khách hàng theo thời gian thực dựa trên thuộc tính nhân khẩu học và hành vi tương tác email."
        badge={
          <Badge variant="default" className="text-xs font-mono font-bold">
            {segments.length} Phân Đoạn
          </Badge>
        }
        actions={
          <PermissionGate
            permission={PERMISSIONS.SEGMENT_CREATE}
            renderDisabled
            disabledTooltip="Bạn không có quyền tạo phân đoạn (SEGMENT_CREATE)"
          >
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('/segments/create')}
            >
              Tạo Phân Đoạn
            </Button>
          </PermissionGate>
        }
      />

      {/* READONLY BANNER */}
      <ReadOnlyBanner resourceName="phân đoạn khách hàng" />

      {/* 2. Search Toolbar */}
      <div className="max-w-md">
        <Input
          placeholder="Tìm kiếm phân đoạn động..."
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 3. SEGMENTS GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSegments.map((seg) => (
          <Card
            key={seg.id}
            className="hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between border-slate-200/90 dark:border-slate-800/90"
            onClick={() => onNavigate(`/segments/${seg.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {seg.name}
                      </CardTitle>
                      <span className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-bold border border-violet-200 dark:border-violet-800/60 uppercase">
                        Dynamic
                      </span>
                    </div>
                    <CardDescription className="text-xs line-clamp-1 mt-0.5">
                      {seg.description}
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
                      <DropdownMenuItem onClick={() => onNavigate(`/segments/${seg.id}`)}>
                        <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
                        <span>Xem chi tiết & danh bạ</span>
                      </DropdownMenuItem>
                      <PermissionGate permission={PERMISSIONS.SEGMENT_UPDATE}>
                        <DropdownMenuItem onClick={() => onNavigate(`/segments/${seg.id}/edit`)}>
                          <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                          <span>Chỉnh sửa điều kiện</span>
                        </DropdownMenuItem>
                      </PermissionGate>
                      <PermissionGate permission={PERMISSIONS.SEGMENT_CREATE}>
                        <DropdownMenuItem onClick={() => handleDuplicate(seg)}>
                          <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                          <span>Nhân bản phân đoạn</span>
                        </DropdownMenuItem>
                      </PermissionGate>
                      <PermissionGate permission={PERMISSIONS.SEGMENT_DELETE}>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(seg.id, seg.name)}
                          className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          <span>Xóa phân đoạn</span>
                        </DropdownMenuItem>
                      </PermissionGate>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {/* Conditions Chip Summary */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-blue-600" />
                  <span>Quy tắc lọc ({seg.matchLogic.toUpperCase()}):</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap font-mono text-[11px]">
                  {seg.conditions.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {c.field} {c.operator === 'equals' ? '=' : c.operator} "{c.value}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Estimated count & enter */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-mono">{seg.contactCount.toLocaleString()}</span>
                  <span className="text-slate-400 font-normal">liên hệ realtime</span>
                </div>

                <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:underline flex items-center gap-1 text-[11px]">
                  <span>Xem danh bạ</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SegmentsPage
