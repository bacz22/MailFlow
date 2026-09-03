import React, { useState } from 'react'
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
import type { DomainItem } from '../types/domain.types'

const DOMAIN_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'VERIFIED', label: 'Đã xác thực (Verified)' },
  { value: 'PENDING', label: 'Chờ cập nhật (Pending)' },
  { value: 'FAILED', label: 'Thất bại (Failed)' },
]

const INITIAL_DOMAINS: DomainItem[] = [
  {
    id: 'dom-1',
    domain: 'mailflow.vn',
    status: 'VERIFIED',
    createdAt: '01/01/2026',
    lastVerifiedAt: 'Vừa xong',
    sendersCount: 2,
    records: [
      {
        id: 'rec-1',
        type: 'TXT',
        name: 'SPF Authentication',
        host: '@',
        value: 'v=spf1 include:mailflow.vn ~all',
        status: 'VERIFIED',
        purpose: 'SPF',
        description: 'Chỉ định máy chủ MailFlow được phép gửi email từ tên miền này.',
      },
      {
        id: 'rec-2',
        type: 'TXT',
        name: 'DKIM Signature',
        host: 'mailflow._domainkey',
        value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3K...DAQAB',
        status: 'VERIFIED',
        purpose: 'DKIM',
        description: 'Chữ ký điện tử 2048-bit mã hóa nội dung chống giả mạo email.',
      },
      {
        id: 'rec-3',
        type: 'TXT',
        name: 'DMARC Policy',
        host: '_dmarc',
        value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@mailflow.vn',
        status: 'VERIFIED',
        purpose: 'DMARC',
        description: 'Quy chuẩn bảo vệ chống phishing và tự động nhận báo cáo vi phạm.',
      },
    ],
  },
  {
    id: 'dom-2',
    domain: 'partner.mailflow.vn',
    status: 'PENDING',
    createdAt: '26/08/2026',
    lastVerifiedAt: '26/08/2026 10:15',
    sendersCount: 1,
    records: [
      {
        id: 'rec-4',
        type: 'TXT',
        name: 'SPF Authentication',
        host: '@',
        value: 'v=spf1 include:mailflow.vn ~all',
        status: 'VERIFIED',
        purpose: 'SPF',
        description: 'Chỉ định máy chủ MailFlow được phép gửi email từ tên miền này.',
      },
      {
        id: 'rec-5',
        type: 'TXT',
        name: 'DKIM Signature',
        host: 'mailflow._domainkey',
        value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD8F...DAQAB',
        status: 'PENDING',
        purpose: 'DKIM',
        description: 'Chữ ký điện tử 2048-bit mã hóa nội dung chống giả mạo email.',
      },
      {
        id: 'rec-6',
        type: 'TXT',
        name: 'DMARC Policy',
        host: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@mailflow.vn',
        status: 'PENDING',
        purpose: 'DMARC',
        description: 'Quy chuẩn bảo vệ chống phishing và tự động nhận báo cáo vi phạm.',
      },
    ],
  },
]

export interface DomainsPageProps {
  onNavigate: (path: string) => void
}

export const DomainsPage: React.FC<DomainsPageProps> = ({ onNavigate: _onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [domains, setDomains] = useState<DomainItem[]>(INITIAL_DOMAINS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [deletingDomain, setDeletingDomain] = useState<DomainItem | null>(null)

  const canManage = hasPermission(PERMISSIONS.DOMAIN_MANAGE)

  // Filtered domains
  const filteredDomains = domains.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (searchQuery && !d.domain.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // Handlers
  const handleCompleteWizard = (newDomain: DomainItem) => {
    setDomains((prev) => [newDomain, ...prev])
    showToast({
      type: 'success',
      title: 'Đã thêm tên miền thành công',
      description: `Tên miền ${newDomain.domain} đã được kích hoạt thành công.`,
    })
  }

  const handleVerifyAgain = async (domainId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 700))
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id === domainId) {
          return {
            ...d,
            status: 'VERIFIED',
            lastVerifiedAt: 'Vừa xong',
            records: d.records.map((r) => ({ ...r, status: 'VERIFIED' })),
          }
        }
        return d
      })
    )
    showToast({
      type: 'success',
      title: 'Đã hoàn tất kiểm tra DNS',
      description: 'Tất cả các bản ghi SPF, DKIM và DMARC đã khớp chuẩn xác 100%.',
    })
  }

  const handleDeleteDomain = (domainId: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== domainId))
    setDeletingDomain(null)
    showToast({
      type: 'success',
      title: 'Đã xóa tên miền',
      description: 'Tên miền đã được gỡ bỏ khỏi hệ thống.',
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header with Add Domain Action */}
      <PageHeader
        title="Quản Lý & Xác Thực Tên Miền (Domain Authentication)"
        description="Cấu hình bản ghi DNS (SPF, DKIM, DMARC) để bảo vệ uy tín thương hiệu và đảm bảo 99.8% email được gửi thẳng vào hộp thư Inbox chính."
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

      {/* 2. Top Summary KPI Cards */}
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
          <div className="text-[11px] font-semibold text-slate-500">Điểm Uy Tín Tên Miền</div>
          <div className="text-2xl font-extrabold font-mono text-blue-600">99 / 100</div>
          <div className="text-[10px] text-blue-600 font-medium">Mức Tối Ưu (Optimal)</div>
        </div>
      </div>

      {/* 3. DNS Knowledge Help Box */}
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

      {/* 4. Filter & Search Controls */}
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

      {/* 5. Domain Cards List */}
      <div className="space-y-4">
        {filteredDomains.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Không tìm thấy tên miền nào khớp với tiêu chí tìm kiếm.
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

      {/* MODALS */}
      {/* 1. Add Domain Step-by-Step Wizard Dialog */}
      <AddDomainWizardDialog
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleCompleteWizard}
      />

      {/* 2. Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingDomain}
        onOpenChange={() => setDeletingDomain(null)}
      >
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
              Mọi địa chỉ người gửi thuộc tên miền này ({deletingDomain?.sendersCount} địa chỉ) sẽ bị hủy quyền gửi thư cho tới khi tên miền được xác thực lại.
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
              onClick={() => {
                if (deletingDomain) {
                  handleDeleteDomain(deletingDomain.id)
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
