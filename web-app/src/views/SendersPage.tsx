import React, { useState } from 'react'
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
import type { VerifiedSender } from '../types/sender.types'

const INITIAL_SENDERS: VerifiedSender[] = [
  {
    id: 'snd-1',
    name: 'MailFlow Product Team',
    email: 'newsletter@mailflow.vn',
    domain: 'mailflow.vn',
    status: 'VERIFIED',
    isVerified: true,
    isDefault: true,
    dkimStatus: 'verified',
    spfStatus: 'verified',
    createdAt: '01/01/2026',
    lastUsedAt: '27/08/2026',
  },
  {
    id: 'snd-2',
    name: 'MailFlow Customer Support',
    email: 'support@mailflow.vn',
    domain: 'mailflow.vn',
    status: 'VERIFIED',
    isVerified: true,
    isDefault: false,
    dkimStatus: 'verified',
    spfStatus: 'verified',
    createdAt: '10/01/2026',
    lastUsedAt: '25/08/2026',
  },
  {
    id: 'snd-3',
    name: 'Phòng Kinh Doanh & Đối Tác',
    email: 'sales@partner.mailflow.vn',
    domain: 'partner.mailflow.vn',
    status: 'PENDING',
    isVerified: false,
    isDefault: false,
    dkimStatus: 'pending',
    spfStatus: 'verified',
    createdAt: '26/08/2026',
  },
  {
    id: 'snd-4',
    name: 'Khuyến Mãi Cuối Tuần',
    email: 'promo@unverified-test.vn',
    domain: 'unverified-test.vn',
    status: 'FAILED',
    isVerified: false,
    isDefault: false,
    dkimStatus: 'failed',
    spfStatus: 'failed',
    createdAt: '20/08/2026',
  },
]

export interface SendersPageProps {
  onNavigate: (path: string) => void
}

export const SendersPage: React.FC<SendersPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [senders, setSenders] = useState<VerifiedSender[]>(INITIAL_SENDERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingSender, setEditingSender] = useState<VerifiedSender | null>(null)
  const [deletingSender, setDeletingSender] = useState<VerifiedSender | null>(null)

  const canManage = hasPermission(PERMISSIONS.SENDER_MANAGE)

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
  const handleAddSender = (name: string, email: string) => {
    const domain = email.split('@')[1] || 'mailflow.vn'
    const newSender: VerifiedSender = {
      id: `snd-${Date.now()}`,
      name,
      email,
      domain,
      status: 'PENDING',
      isVerified: false,
      isDefault: false,
      dkimStatus: 'pending',
      spfStatus: 'pending',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    }

    setSenders((prev) => [newSender, ...prev])
    showToast({
      type: 'success',
      title: 'Đã gửi email xác thực',
      description: `Vui lòng kiểm tra hòm thư ${email} để hoàn tất xác minh người gửi.`,
    })
  }

  const handleEditSender = (senderId: string, newName: string) => {
    setSenders((prev) =>
      prev.map((s) => (s.id === senderId ? { ...s, name: newName } : s))
    )
    showToast({
      type: 'success',
      title: 'Đã cập nhật tên người gửi',
      description: `Tên người gửi đã được đổi thành "${newName}".`,
    })
  }

  const handleDeleteSender = (senderId: string) => {
    setSenders((prev) => prev.filter((s) => s.id !== senderId))
    setDeletingSender(null)
    showToast({
      type: 'success',
      title: 'Đã xóa người gửi',
      description: 'Địa chỉ người gửi đã được xóa khỏi hệ thống.',
    })
  }

  const handleResendVerification = (sender: VerifiedSender) => {
    showToast({
      type: 'info',
      title: 'Đang gửi lại email xác thực',
      description: `Đã gửi mã xác minh mới tới ${sender.email}.`,
    })
  }

  const handleSetDefault = (sender: VerifiedSender) => {
    setSenders((prev) =>
      prev.map((s) => ({
        ...s,
        isDefault: s.id === sender.id,
      }))
    )
    showToast({
      type: 'success',
      title: 'Đã đặt người gửi mặc định',
      description: `"${sender.name}" (${sender.email}) đã được đặt làm người gửi mặc định cho các chiến dịch mới.`,
    })
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="VERIFIED">Đã xác minh (Verified)</option>
              <option value="PENDING">Chờ xác thực (Pending)</option>
              <option value="FAILED">Thất bại (Failed)</option>
            </select>

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
                  handleDeleteSender(deletingSender.id)
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
