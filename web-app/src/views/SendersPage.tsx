import React, { useCallback, useEffect, useState } from 'react'
import {
  PlusCircle,
  Search,
  Globe,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SenderTable } from '../components/senders/SenderTable'
import { AddSenderDialog } from '../components/senders/AddSenderDialog'
import { EditSenderDialog } from '../components/senders/EditSenderDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import { SimpleSelect, type SelectOption } from '../components/ui/Select'
import { ApiError } from '../services/apiClient'
import { senderService } from '../services/sender.service'
import type { VerifiedSender } from '../types/sender.types'

const SENDER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'VERIFIED', label: 'Đã xác minh (Verified)' },
  { value: 'PENDING', label: 'Chờ xác thực (Pending)' },
  { value: 'FAILED', label: 'Thất bại (Failed)' },
]

export interface SendersPageProps {
  onNavigate: (path: string) => void
}

export const SendersPage: React.FC<SendersPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [senders, setSenders] = useState<VerifiedSender[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingSender, setEditingSender] = useState<VerifiedSender | null>(null)
  const [deletingSender, setDeletingSender] = useState<VerifiedSender | null>(null)

  const canManage = hasPermission(PERMISSIONS.SENDER_MANAGE)

  const loadSenders = useCallback(async () => {
    try {
      const data = await senderService.list()
      setSenders(data)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được người gửi',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }, [showToast])

  useEffect(() => {
    void loadSenders()
  }, [loadSenders])

  // Filtered senders
  const filteredSenders = senders.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q) && !s.domain.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  // Handlers
  const handleAddSender = async (name: string, email: string) => {
    try {
      await senderService.create({ name, email })
      await loadSenders()
      showToast({
        type: 'success',
        title: 'Đã thêm người gửi',
        description: `${name} <${email}> đã sẵn sàng dùng cho chiến dịch.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thêm được người gửi',
        description: error instanceof ApiError ? (error.detail || error.message) : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  const handleEditSender = async (senderId: string, newName: string) => {
    try {
      await senderService.update(senderId, { name: newName })
      await loadSenders()
      showToast({
        type: 'success',
        title: 'Đã cập nhật tên người gửi',
        description: `Tên người gửi đã được đổi thành "${newName}".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không cập nhật được người gửi',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  const handleDeleteSender = async (senderId: string) => {
    try {
      await senderService.delete(senderId)
      setDeletingSender(null)
      await loadSenders()
      showToast({
        type: 'success',
        title: 'Đã xóa người gửi',
        description: 'Địa chỉ người gửi đã được xóa khỏi hệ thống.',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được người gửi',
        description: error instanceof ApiError ? error.detail : 'Người gửi có thể đang được chiến dịch sử dụng.',
      })
    }
  }

  const handleResendVerification = (sender: VerifiedSender) => {
    showToast({
      type: 'info',
      title: 'Không cần xác thực email',
      description: `Người gửi ${sender.email} dùng trạng thái ACTIVE/DISABLED. Xác minh DKIM sẽ có ở bước Domains.`,
    })
  }

  const handleSetDefault = async (sender: VerifiedSender) => {
    try {
      await senderService.setDefault(sender.id)
      await loadSenders()
      showToast({
        type: 'success',
        title: 'Đã đặt người gửi mặc định',
        description: `"${sender.name}" (${sender.email}) đã được đặt làm người gửi mặc định cho các chiến dịch mới.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không đặt được mặc định',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header with Add Sender Action */}
      <PageHeader
        title="Quản Lý Địa Chỉ Người Gửi (Verified Senders)"
        description="Đăng ký và xác thực các địa chỉ email gửi thư (From Address). Chỉ các địa chỉ đã xác minh (Verified) mới có thể chọn phát hành chiến dịch."
        actions={
          canManage && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsAddOpen(true)}
            >
              Thêm Người Gửi Mới
            </Button>
          )
        }
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Tổng Người Gửi</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
            {senders.length}
          </div>
          <div className="text-[10px] text-slate-400">Đã đăng ký hệ thống</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Đã Xác Minh (Verified)</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">
            {senders.filter((s) => s.status === 'VERIFIED').length}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Sẵn sàng gửi chiến dịch</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Chờ Xác Thực</div>
          <div className="text-2xl font-extrabold font-mono text-amber-600">
            {senders.filter((s) => s.status === 'PENDING').length}
          </div>
          <div className="text-[10px] text-slate-400">Cần bấm link xác minh email</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Tên Miền Đã Gắn</div>
          <div className="text-2xl font-extrabold font-mono text-blue-600">
            {new Set(senders.map((s) => s.domain)).size}
          </div>
          <div className="text-[10px] text-blue-600 font-medium">SPF/DKIM cấu hình tự động</div>
        </div>
      </div>

      {/* 3. DNS Link Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              Cấu hình bản ghi DNS tên miền (DKIM / SPF / DMARC)
            </span>
            <p className="text-blue-800/80 dark:text-blue-300 text-[11px]">
              Để đạt tỷ lệ vào Inbox tối đa (99.8%), hãy đảm bảo tên miền chứa địa chỉ người gửi đã được thêm vào mục Quản lý Tên Miền.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-blue-300 text-blue-700 dark:text-blue-300 shrink-0"
          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={() => onNavigate('/settings/domains')}
        >
          Quản Lý Tên Miền (Domains)
        </Button>
      </div>

      {/* 4. Table Card with Filter & Search */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Danh Sách Người Gửi</CardTitle>
            <CardDescription className="text-xs">
              Quản lý tên hiển thị, địa chỉ email và trạng thái xác thực máy chủ.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-52">
              <SimpleSelect
                size="sm"
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={SENDER_STATUS_OPTIONS}
                className="rounded-xl font-semibold"
              />
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Tìm theo tên, email hoặc tên miền..."
                leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <SenderTable
            senders={filteredSenders}
            onEditSender={(s) => setEditingSender(s)}
            onDeleteSender={(s) => setDeletingSender(s)}
            onResendVerification={handleResendVerification}
            onSetDefault={handleSetDefault}
          />
        </CardContent>
      </Card>

      {/* MODALS */}
      {/* 1. Add Sender Dialog */}
      <AddSenderDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddSender={handleAddSender}
      />

      {/* 2. Edit Sender Dialog */}
      <EditSenderDialog
        isOpen={!!editingSender}
        onClose={() => setEditingSender(null)}
        sender={editingSender}
        onSave={handleEditSender}
      />

      {/* 3. Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingSender}
        onOpenChange={() => setDeletingSender(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Xóa Địa Chỉ Người Gửi?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Bạn có chắc chắn muốn xóa địa chỉ người gửi{' '}
              <strong>"{deletingSender?.name}"</strong> &lt;{deletingSender?.email}&gt; không?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <p className="text-[11px] leading-relaxed">
              Các chiến dịch email chưa gửi đang sử dụng địa chỉ này sẽ cần được cấu hình lại người gửi trước khi phát hành.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingSender(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 font-bold"
              onClick={() => {
                if (deletingSender) {
                  void handleDeleteSender(deletingSender.id)
                }
              }}
            >
              Xác Nhận Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SendersPage
