import React, { useEffect, useState } from 'react'
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
import { ApiError } from '../services/apiClient'
import { listService } from '../services/list.service'
import { segmentService } from '../services/segment.service'
import type { SegmentCondition, DynamicSegment, MatchLogic } from '../types/segment.types'
import type { Contact } from '../types/contact.types'
import type { AudienceList } from '../types/list.types'

const FIELD_DEFINITIONS = [
  { key: 'status', label: 'Trạng Thái Gửi Thư', type: 'status' as const, defaultOp: 'equals' },
  { key: 'tags', label: 'Thẻ Gắn Liền (Tags)', type: 'tag' as const, defaultOp: 'contains' },
  { key: 'company', label: 'Tên Công Ty / Doanh Nghiệp', type: 'string' as const, defaultOp: 'contains' },
  { key: 'email', label: 'Địa Chỉ Email', type: 'string' as const, defaultOp: 'contains' },
  { key: 'city', label: 'Thành Phố (Custom Field)', type: 'string' as const, defaultOp: 'equals' },
  { key: 'job_title', label: 'Chức Danh (Custom Field)', type: 'string' as const, defaultOp: 'contains' },
  { key: 'created_at', label: 'Ngày Tạo Hồ Sơ', type: 'date' as const, defaultOp: 'in_the_last_days' },
  { key: 'list_id', label: 'Thuộc Danh Sách', type: 'list' as const, defaultOp: 'in' },
]

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'Bằng chính xác (=)',
  not_equals: 'Không bằng (!=)',
  contains: 'Chứa từ khóa (Contains)',
  not_contains: 'Không chứa',
  starts_with: 'Bắt đầu với (Starts with)',
  in: 'Thuộc danh sách',
  not_in: 'Không thuộc danh sách',
  after: 'Sau ngày (After)',
  before: 'Trước ngày (Before)',
  in_the_last_days: 'Trong vòng (X ngày qua)',
}

export interface SegmentBuilderPageProps {
  segmentId?: string
  initialData?: Partial<DynamicSegment>
  isEdit?: boolean
  onNavigate: (path: string) => void
}

export const SegmentBuilderPage: React.FC<SegmentBuilderPageProps> = ({
  segmentId,
  initialData,
  isEdit = false,
  onNavigate,
}) => {
  const { showToast } = useToast()

  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [matchLogic, setMatchLogic] = useState<MatchLogic>(initialData?.matchLogic || 'and')
  const [conditions, setConditions] = useState<SegmentCondition[]>(
    initialData?.conditions || [
      { id: 'c-1', field: 'status', operator: 'equals', value: 'active', fieldType: 'status' },
    ]
  )
  const [availableLists, setAvailableLists] = useState<AudienceList[]>([])
  const [previewContacts, setPreviewContacts] = useState<Contact[]>([])
  const [previewCount, setPreviewCount] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSegment, setIsLoadingSegment] = useState(Boolean(isEdit && segmentId))

  useEffect(() => {
    listService
      .list()
      .then(setAvailableLists)
      .catch(() => setAvailableLists([]))
  }, [])

  useEffect(() => {
    if (!isEdit || !segmentId) {
      return
    }
    let cancelled = false
    setIsLoadingSegment(true)
    segmentService
      .get(segmentId)
      .then((segment) => {
        if (cancelled) return
        setName(segment.name)
        setDescription(segment.description)
        setMatchLogic(segment.matchLogic)
        setConditions(
          (segment.conditions.length > 0
            ? segment.conditions
            : [{ id: 'c-1', field: 'status', operator: 'equals', value: 'active', fieldType: 'status' as const }]
          ).map((c) => {
            const def = FIELD_DEFINITIONS.find((f) => f.key === c.field)
            return {
              ...c,
              fieldType: def?.type || c.fieldType || 'string',
            }
          })
        )
        setPreviewCount(segment.contactCount)
      })
      .catch((error) => {
        if (cancelled) return
        showToast({
          type: 'error',
          title: 'Không tải được phân đoạn',
          description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
        })
        onNavigate('/segments')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSegment(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, segmentId, onNavigate, showToast])

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

  const runPreview = async () => {
    setIsPreviewLoading(true)
    try {
      const result = await segmentService.preview({
        matchLogic,
        conditions,
        page: 0,
        size: 10,
      })
      setPreviewContacts(result.content)
      setPreviewCount(result.totalElements)
      setIsPreviewOpen(true)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xem trước được',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập tên phân đoạn',
        description: 'Vui lòng cung cấp tên phân đoạn để lưu lại.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        matchLogic,
        conditions,
      }
      const saved =
        isEdit && segmentId
          ? await segmentService.update(segmentId, payload)
          : await segmentService.create(payload)
      showToast({
        type: 'success',
        title: isEdit ? 'Đã cập nhật phân đoạn' : 'Đã tạo phân đoạn động',
        description: `Phân đoạn "${saved.name}" hiện có ${saved.contactCount.toLocaleString('vi-VN')} liên hệ phù hợp.`,
      })
      onNavigate(`/segments/${saved.id}`)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không lưu được phân đoạn',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingSegment) {
    return <div className="text-sm text-slate-500 py-10 text-center">Đang tải phân đoạn...</div>
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
                          {cond.fieldType === 'date' && (
                            <>
                              <option value="in_the_last_days">{OPERATOR_LABELS.in_the_last_days}</option>
                              <option value="after">{OPERATOR_LABELS.after}</option>
                              <option value="before">{OPERATOR_LABELS.before}</option>
                            </>
                          )}
                          {cond.fieldType === 'tag' && (
                            <>
                              <option value="contains">{OPERATOR_LABELS.contains}</option>
                              <option value="not_contains">{OPERATOR_LABELS.not_contains}</option>
                            </>
                          )}
                          {cond.fieldType === 'list' && (
                            <>
                              <option value="in">{OPERATOR_LABELS.in}</option>
                              <option value="not_in">{OPERATOR_LABELS.not_in}</option>
                            </>
                          )}
                          {(cond.fieldType === 'string' || cond.fieldType === 'status') && (
                            <>
                              <option value="equals">{OPERATOR_LABELS.equals}</option>
                              {cond.fieldType === 'string' && (
                                <>
                                  <option value="contains">{OPERATOR_LABELS.contains}</option>
                                  <option value="starts_with">{OPERATOR_LABELS.starts_with}</option>
                                </>
                              )}
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
                            <option value="invalid">Không hợp lệ</option>
                            <option value="blocked">Đã chặn</option>
                          </select>
                        ) : cond.fieldType === 'list' ? (
                          <select
                            value={cond.value}
                            onChange={(e) => handleValueChange(cond.id, e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold focus-ring cursor-pointer"
                          >
                            <option value="">Chọn danh sách...</option>
                            {availableLists.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.name}
                              </option>
                            ))}
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
                  {previewCount.toLocaleString('vi-VN')}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Liên Hệ Khớp Điều Kiện
                </div>
                <div className="text-[11px] text-slate-400">
                  Bấm xem trước để tính lại theo quy tắc hiện tại
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full justify-center text-xs font-bold text-blue-600 dark:text-blue-400"
                leftIcon={<Eye className="w-4 h-4" />}
                isLoading={isPreviewLoading}
                onClick={() => void runPreview()}
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
                onClick={() => void handleSave()}
              >
                {isEdit ? 'Cập Nhật Phân Đoạn' : 'Lưu Phân Đoạn'}
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
              <DialogTitle>
                Xem Trước Danh Bạ Phân Đoạn ({previewCount.toLocaleString('vi-VN')} Contacts)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Các liên hệ đang khớp với tiêu chí lọc hiện tại (tối đa 10 dòng mẫu).
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <ContactTable
              contacts={previewContacts}
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
