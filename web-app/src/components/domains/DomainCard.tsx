import React, { useState } from 'react'
import {
  Globe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { DnsRecordRow } from './DnsRecordRow'
import { usePermission, PERMISSIONS } from '../../permissions'
import type { DomainItem } from '../../types/domain.types'

export interface DomainCardProps {
  domain: DomainItem
  onVerifyAgain: (domainId: string) => Promise<void>
  onDeleteDomain: (domain: DomainItem) => void
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  onVerifyAgain,
  onDeleteDomain,
}) => {
  const { hasPermission } = usePermission()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)

  const canManage = hasPermission(PERMISSIONS.DOMAIN_MANAGE)
  const isVerified = domain.status === 'VERIFIED'
  const isPending = domain.status === 'PENDING'

  const handleVerify = async () => {
    setIsVerifying(true)
    await onVerifyAgain(domain.id)
    setIsVerifying(false)
  }

  return (
    <Card className="overflow-hidden border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
      <CardHeader className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Domain name & badge */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {domain.domain}
                </h3>

                {/* Status Badge */}
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold text-xs px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã Xác Thực DNS (Active)</span>
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>Chờ Cập Nhật DNS</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-800 dark:text-rose-300 font-bold text-xs px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Bản Ghi Không Khớp</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                <span>Thêm ngày: {domain.createdAt}</span>
                <span>• Kiểm tra lần cuối: <span className="font-mono">{domain.lastVerifiedAt}</span></span>
                <span>• Đang gán cho <strong>{domain.sendersCount}</strong> người gửi</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />}
                isLoading={isVerifying}
                onClick={handleVerify}
              >
                Kiểm Tra Lại DNS
              </Button>
            )}

            {canManage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                onClick={() => onDeleteDomain(domain)}
                title="Xóa tên miền"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-500"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Collapsible DNS Records Table */}
      {isExpanded && (
        <CardContent className="p-0 animate-in fade-in-0">
          <div className="p-4 bg-blue-50/30 dark:bg-blue-950/10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Bản Ghi Xác Thực Máy Chủ (SPF, DKIM, DMARC):</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Cần cấu hình chính xác tại trang quản lý DNS nhà cung cấp tên miền của bạn.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Loại & Mục Đích</th>
                  <th className="py-2.5 px-4">Tên Bản Ghi (Host / Name)</th>
                  <th className="py-2.5 px-4">Giá Trị Cần Trỏ (Value / Target)</th>
                  <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {domain.records.map((rec) => (
                  <DnsRecordRow key={rec.id} record={rec} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default DomainCard
