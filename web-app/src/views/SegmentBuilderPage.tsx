import React, { useState } from 'react'
import {
  ArrowLeft,
  Filter,
  Plus,
  Trash2,
  Users,
  Eye,
  Save,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FormField, FormLabel } from '../components/ui/FormGroup'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/Dialog'
import { ContactTable } from '../components/contacts/ContactTable'
import { useToast } from '../components/ui/Toast'
import type { SegmentCondition, DynamicSegment, MatchLogic } from '../types/segment.types'
import type { Contact } from '../types/contact.types'

const FIELD_DEFINITIONS = [
  { key: 'city', label: 'Thành Phố / Khu Vực', type: 'string' as const, defaultOp: 'equals' },
  { key: 'tags', label: 'Thẻ Gắn Liền (Tags)', type: 'tag' as const, defaultOp: 'contains' },
  { key: 'status', label: 'Trạng Thái Gửi Thư', type: 'status' as const, defaultOp: 'equals' },
  { key: 'company', label: 'Tên Công Ty / Doanh Nghiệp', type: 'string' as const, defaultOp: 'contains' },
  { key: 'job_title', label: 'Chức Danh / Vị Trí', type: 'string' as const, defaultOp: 'contains' },
  { key: 'engagement_score', label: 'Điểm Tương Tác (Score)', type: 'number' as const, defaultOp: 'greater_than' },
  { key: 'created_at', label: 'Ngày Tạo Hồ Sơ', type: 'date' as const, defaultOp: 'in_the_last_days' },
]

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'Bằng chính xác (=)',
  not_equals: 'Không bằng (!=)',
  contains: 'Chứa từ khóa (Contains)',
  starts_with: 'Bắt đầu với (Starts with)',
  greater_than: 'Lớn hơn (>)',
  less_than: 'Nhỏ hơn (<)',
  after: 'Sau ngày (After)',
  before: 'Trước ngày (Before)',
  in_the_last_days: 'Trong vòng (X ngày qua)',
}

const PREVIEW_MATCHED_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    firstName: 'Thành',
    lastName: 'Nguyễn Văn',
    fullName: 'Nguyễn Văn Thành',
    email: 'thanh.nguyen@vcorp.vn',
    company: 'V-Corp Global',
    lists: ['VIP Enterprise'],
    tags: ['Customer', 'VIP'],
    status: 'active',
    createdAt: '15/08/2026',
    updatedAt: '24/08/2026',
  },
  {
    id: 'cnt-3',
    firstName: 'Hương',
    lastName: 'Phạm Thu',
    fullName: 'Phạm Thu Hương',
    email: 'huong.pham@fintech.asia',
    company: 'Fintech Asia Hub',
    lists: ['VIP Enterprise'],
    tags: ['Customer', 'VIP', 'Decision Maker'],
    status: 'active',
    createdAt: '10/08/2026',
    updatedAt: '22/08/2026',
  },
  {
    id: 'cnt-8',
    firstName: 'Trang',
    lastName: 'Bùi Thùy',
    fullName: 'Bùi Thùy Trang',
    email: 'trang.bui@ecomviet.vn',
    company: 'EcomViet Mart',
    lists: ['VIP Enterprise'],
    tags: ['Customer', 'VIP'],
    status: 'active',
    createdAt: '14/08/2026',
    updatedAt: '23/08/2026',
  },
]

export interface SegmentBuilderPageProps {
  segmentId?: string
  initialData?: Partial<DynamicSegment>
  isEdit?: boolean
  onNavigate: (path: string) => void
}

export const SegmentBuilderPage: React.FC<SegmentBuilderPageProps> = ({
  initialData,
  isEdit = false,
  onNavigate,
}) => {
  const { showToast } = useToast()

  const [name, setName] = useState(initialData?.name || 'Khách Hàng Doanh Nghiệp Trọng Điểm')
  const [description, setDescription] = useState(
    initialData?.description || 'Phân đoạn tự động lọc các liên hệ tại Hà Nội có gắn thẻ VIP và trạng thái Active.'
  )
  const [matchLogic, setMatchLogic] = useState<MatchLogic>(initialData?.matchLogic || 'and')

  const [conditions, setConditions] = useState<SegmentCondition[]>(
    initialData?.conditions || [
      { id: 'c-1', field: 'city', operator: 'equals', value: 'Hà Nội', fieldType: 'string' },
      { id: 'c-2', field: 'tags', operator: 'contains', value: 'VIP', fieldType: 'tag' },
      { id: 'c-3', field: 'status', operator: 'equals', value: 'active', fieldType: 'status' },
    ]
  )

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddCondition = () => {
    const newCond: SegmentCondition = {
      id: `c-${Date.now()}`,
      field: 'company',
      operator: 'contains',
      value: '',
      fieldType: 'string',
    }
    setConditions((prev) => [...prev, newCond])
  }

  const handleRemoveCondition = (id: string) => {
    if (conditions.length <= 1) {
      showToast({
        type: 'warning',
        title: 'Cần ít nhất 1 điều kiện',
        description: 'Phân đoạn động cần tối thiểu một tiêu chí lọc.',
      })
      return
    }
    setConditions((prev) => prev.filter((c) => c.id !== id))
  }

  const handleFieldChange = (id: string, fieldKey: string) => {
    const targetDef = FIELD_DEFINITIONS.find((f) => f.key === fieldKey) || FIELD_DEFINITIONS[0]
    setConditions((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              field: targetDef.key,
              fieldType: targetDef.type,
              operator: targetDef.defaultOp,
              value: targetDef.type === 'status' ? 'active' : '',
            }
          : c
      )
    )
  }

  const handleOperatorChange = (id: string, op: string) => {
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, operator: op } : c)))
  }

  const handleValueChange = (id: string, val: string) => {
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, value: val } : c)))
  }

  const handleSave = async (isDraft = false) => {
    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập tên phân đoạn',
        description: 'Vui lòng cung cấp tên phân đoạn để lưu lại.',
      })
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)

    showToast({
      type: 'success',
      title: isDraft ? 'Đã lưu bản nháp' : isEdit ? 'Đã cập nhật phân đoạn' : 'Đã tạo phân đoạn động',
      description: `Phân đoạn "${name}" hiện có 2,315 liên hệ phù hợp.`,
    })

    onNavigate('/segments')
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title={isEdit ? `Chỉnh Sửa Phân Đoạn: ${name}` : 'Tạo Phân Đoạn Động (Segment Builder)'}
        description="Thiết lập bộ quy tắc logic để tự động cập nhật danh bạ khách hàng theo thời gian thực."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('/segments')}
          >
            Quay Lại Phân Đoạn
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Conditions Builder (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* General Information Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base">Thông Tin Phân Đoạn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FormField>
                <FormLabel required>Tên Phân Đoạn (Segment Name)</FormLabel>
                <Input
                  placeholder="Ví dụ: Khách Hàng VIP Hà Nội..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>

              <FormField>
                <FormLabel>Mô Tả Mục Đích</FormLabel>
                <textarea
                  rows={2}
                  placeholder="Ghi chú mục đích của phân đoạn này cho toàn team..."
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus-ring placeholder:text-slate-400"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Logic & Conditions Builder Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-base">Bộ Quy Tắc Lọc (Condition Rules)</CardTitle>
                  <CardDescription className="text-xs">
                    Mỗi liên hệ thỏa mãn quy tắc sẽ tự động được thêm vào phân đoạn này.
                  </CardDescription>
                </div>
              </div>

              {/* Logic Selector Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setMatchLogic('and')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    matchLogic === 'and'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  TẤT CẢ (AND)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchLogic('or')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    matchLogic === 'or'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  BẤT KỲ (OR)
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* List of Condition Rows */}
              <div className="space-y-3">
                {conditions.map((cond, idx) => {
                  return (
                    <div
                      key={cond.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                    >
                      {/* Logic Label indicator */}
                      <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 w-10 text-center uppercase shrink-0">
                        {idx === 0 ? 'Nếu' : matchLogic}
                      </span>

                      {/* 1. Field Selector */}
                      <div className="flex-1 min-w-[140px]">
                        <select
                          value={cond.field}
                          onChange={(e) => handleFieldChange(cond.id, e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold focus-ring cursor-pointer"
                        >
                          {FIELD_DEFINITIONS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Operator Selector */}
                      <div className="flex-1 min-w-[130px]">
                        <select
                          value={cond.operator}
                          onChange={(e) => handleOperatorChange(cond.id, e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold focus-ring cursor-pointer"
                        >
                          {cond.fieldType === 'number' && (
                            <>
                              <option value="greater_than">{OPERATOR_LABELS.greater_than}</option>
                              <option value="less_than">{OPERATOR_LABELS.less_than}</option>
                              <option value="equals">{OPERATOR_LABELS.equals}</option>
                            </>
                          )}
                          {cond.fieldType === 'date' && (
                            <>
                              <option value="in_the_last_days">{OPERATOR_LABELS.in_the_last_days}</option>
                              <option value="after">{OPERATOR_LABELS.after}</option>
                              <option value="before">{OPERATOR_LABELS.before}</option>
                            </>
                          )}
                          {(cond.fieldType === 'string' || cond.fieldType === 'tag' || cond.fieldType === 'status') && (
                            <>
                              <option value="equals">{OPERATOR_LABELS.equals}</option>
                              <option value="contains">{OPERATOR_LABELS.contains}</option>
                              <option value="starts_with">{OPERATOR_LABELS.starts_with}</option>
                              <option value="not_equals">{OPERATOR_LABELS.not_equals}</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* 3. Value Input */}
                      <div className="flex-1 min-w-[140px]">
                        {cond.fieldType === 'status' ? (
                          <select
                            value={cond.value}
                            onChange={(e) => handleValueChange(cond.id, e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold focus-ring cursor-pointer"
                          >
                            <option value="active">Hoạt động (Active)</option>
                            <option value="unsubscribed">Hủy đăng ký (Unsubscribed)</option>
                            <option value="bounced">Bounced (Lỗi trả về)</option>
                          </select>
                        ) : (
                          <Input
                            placeholder="Nhập giá trị so khớp..."
                            value={cond.value}
                            onChange={(e) => handleValueChange(cond.id, e.target.value)}
                            className="h-9 text-xs"
                          />
                        )}
                      </div>

                      {/* Delete row */}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(cond.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer self-end sm:self-auto"
                        title="Xóa điều kiện này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Add condition button */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddCondition}
                >
                  Thêm Điều Kiện Lọc
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Estimate & Actions Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Estimated Audience Card */}
          <Card className="border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/30 to-transparent">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base">Ước Tính Quy Mô</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Số lượng liên hệ thỏa mãn quy tắc logic hiện tại.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900 text-center space-y-1 shadow-xs">
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  2,315
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Liên Hệ Khớp Điều Kiện
                </div>
                <div className="text-[11px] text-slate-400">
                  Chiếm 16.2% tổng danh bạ toàn hệ thống
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full justify-center text-xs font-bold text-blue-600 dark:text-blue-400"
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={() => setIsPreviewOpen(true)}
              >
                Xem Trước Danh Bạ Khớp
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons Box */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={() => handleSave(false)}
              >
                {isEdit ? 'Cập Nhật Phân Đoạn' : 'Lưu Phân Đoạn'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                onClick={() => handleSave(true)}
              >
                Lưu Bản Nháp
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center text-slate-500"
                onClick={() => onNavigate('/segments')}
              >
                Hủy Bỏ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. PREVIEW CONTACTS DIALOG */}
      <Dialog open={isPreviewOpen} onOpenChange={() => setIsPreviewOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <DialogTitle>Xem Trước Danh Bạ Phân Đoạn (2,315 Contacts)</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Dưới đây là 3 liên hệ đại diện đang khớp với các tiêu chí lọc vừa tạo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <ContactTable
              contacts={PREVIEW_MATCHED_CONTACTS}
              selectedIds={[]}
              onSelectRow={() => {}}
              onSelectAllPage={() => {}}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SegmentBuilderPage
