import React, { useCallback, useEffect, useState } from 'react'
import {
  PlusCircle,
  Search,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { DomainCard } from '../components/domains/DomainCard'
import { AddDomainWizardDialog } from '../components/domains/AddDomainWizardDialog'
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
import { domainService } from '../services/domain.service'
import type { DomainItem } from '../types/domain.types'

const DOMAIN_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'VERIFIED', label: 'Đã xác thực (Verified)' },
  { value: 'PENDING', label: 'Chờ cập nhật (Pending)' },
  { value: 'FAILED', label: 'Thất bại (Failed)' },
]

export interface DomainsPageProps {
  onNavigate: (path: string) => void
}

export const DomainsPage: React.FC<DomainsPageProps> = ({ onNavigate: _onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [domains, setDomains] = useState<DomainItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [deletingDomain, setDeletingDomain] = useState<DomainItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const canManage = hasPermission(PERMISSIONS.DOMAIN_MANAGE)

  const loadDomains = useCallback(async () => {
    try {
      const rows = await domainService.list()
      setDomains(rows)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được tên miền',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadDomains()
  }, [loadDomains])

  const filteredDomains = domains.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (searchQuery && !d.domain.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const handleCompleteWizard = (newDomain: DomainItem) => {
    setDomains((prev) => {
      const without = prev.filter((d) => d.id !== newDomain.id)
      return [newDomain, ...without]
    })
    showToast({
      type: 'success',
      title: 'Đã thêm tên miền',
      description: `Tên miền ${newDomain.domain} đã được lưu (trạng thái: ${newDomain.status}).`,
    })
  }

  const handleVerifyAgain = async (domainId: string) => {
    try {
      const updated = await domainService.verify(domainId)
      setDomains((prev) => prev.map((d) => (d.id === domainId ? updated : d)))
      showToast({
        type: updated.status === 'VERIFIED' ? 'success' : 'warning',
        title: updated.status === 'VERIFIED' ? 'Đã xác thực DNS' : 'DNS chưa khớp đủ',
        description:
          updated.status === 'VERIFIED'
            ? 'Tất cả bản ghi SPF/DKIM/DMARC đã được đánh dấu hợp lệ.'
            : `Trạng thái hiện tại: ${updated.status}.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không kiểm tra được DNS',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    setIsDeleting(true)
    try {
      await domainService.delete(domainId)
      setDomains((prev) => prev.filter((d) => d.id !== domainId))
      setDeletingDomain(null)
      showToast({
        type: 'success',
        title: 'Đã xóa tên miền',
        description: 'Tên miền đã được gỡ bỏ khỏi hệ thống.',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được tên miền',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Quản Lý & Xác Thực Tên Miền (Domain Authentication)"
        description="Cấu hình bản ghi DNS (SPF, DKIM, DMARC) để bảo vệ uy tín thương hiệu và cải thiện tỷ lệ vào Inbox."
        actions={
          canManage && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsWizardOpen(true)}
            >
              Thêm Tên Miền Mới
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Tổng Tên Miền</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
            {domains.length}
          </div>
          <div className="text-[10px] text-slate-400">Đã đăng ký DNS</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Đã Xác Thực (Active)</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">
            {domains.filter((d) => d.status === 'VERIFIED').length}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">SPF/DKIM/DMARC hợp lệ</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Chờ Lan Truyền DNS</div>
          <div className="text-2xl font-extrabold font-mono text-amber-600">
            {domains.filter((d) => d.status === 'PENDING').length}
          </div>
          <div className="text-[10px] text-slate-400">Đang chờ cập nhật nameserver</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Thất bại / lệch DNS</div>
          <div className="text-2xl font-extrabold font-mono text-rose-600">
            {domains.filter((d) => d.status === 'FAILED').length}
          </div>
          <div className="text-[10px] text-rose-600 font-medium">Cần kiểm tra lại</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              Kiến Thức Kỹ Thuật: Bản Ghi SPF, DKIM & DMARC Là Gì?
            </span>
            <p className="text-blue-800/80 dark:text-blue-300 text-[11px] leading-relaxed">
              <strong>SPF</strong> xác định máy chủ được phép gửi thư. <strong>DKIM</strong> gắn chữ ký số chống sửa đổi nội dung. <strong>DMARC</strong> chỉ dẫn Gmail/Outlook xử lý email nếu bị kẻ xấu giả mạo.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-52">
          <SimpleSelect
            size="sm"
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={DOMAIN_STATUS_OPTIONS}
            className="rounded-xl font-semibold"
          />
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Tìm theo tên miền..."
            leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Đang tải tên miền...
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Chưa có tên miền nào. Hãy thêm tên miền để xác thực SPF/DKIM.
          </div>
        ) : (
          filteredDomains.map((dom) => (
            <DomainCard
              key={dom.id}
              domain={dom}
              onVerifyAgain={handleVerifyAgain}
              onDeleteDomain={(d) => setDeletingDomain(d)}
            />
          ))
        )}
      </div>

      <AddDomainWizardDialog
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleCompleteWizard}
      />

      <Dialog open={!!deletingDomain} onOpenChange={() => setDeletingDomain(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Xóa Tên Miền Khỏi Hệ Thống?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Bạn có chắc chắn muốn gỡ bỏ tên miền <strong>{deletingDomain?.domain}</strong> không?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <p className="text-[11px] leading-relaxed">
              Mọi địa chỉ người gửi thuộc tên miền này ({deletingDomain?.sendersCount} địa chỉ) sẽ mất liên kết domain (FK SET NULL).
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingDomain(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 font-bold"
              isLoading={isDeleting}
              onClick={() => {
                if (deletingDomain) {
                  void handleDeleteDomain(deletingDomain.id)
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

export default DomainsPage
