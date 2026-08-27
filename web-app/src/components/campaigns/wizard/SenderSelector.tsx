import React from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Check,
  Mail,
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { usePermission, PERMISSIONS } from '../../../permissions'
import type { VerifiedSender } from '../../../types/sender.types'

export const SAMPLE_SENDERS: VerifiedSender[] = [
  {
    id: 'snd-1',
    name: 'MailFlow Product Team',
    email: 'newsletter@mailflow.vn',
    domain: 'mailflow.vn',
    isVerified: true,
    isDefault: true,
    dkimStatus: 'verified',
    spfStatus: 'verified',
  },
  {
    id: 'snd-2',
    name: 'Nguyễn Văn Thành - CEO',
    email: 'thanh.nguyen@mailflow.vn',
    domain: 'mailflow.vn',
    isVerified: true,
    dkimStatus: 'verified',
    spfStatus: 'verified',
  },
  {
    id: 'snd-3',
    name: 'Marketing Special Offers',
    email: 'promo@marketing-deals.com',
    domain: 'marketing-deals.com',
    isVerified: false,
    dkimStatus: 'pending',
    spfStatus: 'failed',
  },
]

export interface SenderSelectorProps {
  selectedSenderId: string
  onSelectSender: (sender: VerifiedSender) => void
  senders?: VerifiedSender[]
  onNavigateSettings?: () => void
}

export const SenderSelector: React.FC<SenderSelectorProps> = ({
  selectedSenderId,
  onSelectSender,
  senders = SAMPLE_SENDERS,
  onNavigateSettings,
}) => {
  const { hasPermission } = usePermission()
  const verifiedSenders = senders.filter((s) => s.isVerified)
  const hasNoVerified = verifiedSenders.length === 0

  if (hasNoVerified) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-3 text-xs">
        <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">Chưa Có Địa Chỉ Người Gửi Đã Xác Thực (Sender)</div>
            <p className="leading-relaxed text-amber-700/90 dark:text-amber-400">
              Để đảm bảo tỷ lệ vào Inbox cao nhất và tuân thủ các quy chuẩn chống giả mạo email của Google & Yahoo, bạn cần xác thực bản ghi DKIM/SPF của tên miền gửi thư.
            </p>
          </div>
        </div>

        {hasPermission(PERMISSIONS.SENDER_READ) && onNavigateSettings && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs bg-white dark:bg-slate-900 border-amber-300 text-amber-900 dark:text-amber-200"
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={onNavigateSettings}
          >
            Cấu Hình & Xác Thực Người Gửi Mới
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-blue-600" />
          <span>Chọn Người Gửi (Sender) *</span>
        </label>
        <span className="text-[11px] text-slate-400">
          Chỉ người gửi đã xác thực DKIM/SPF mới được phép phát hành
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {senders.map((sender) => {
          const isSelected = selectedSenderId === sender.id
          const isAllowed = sender.isVerified

          return (
            <div
              key={sender.id}
              onClick={() => {
                if (isAllowed) {
                  onSelectSender(sender)
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-xs select-none ${
                !isAllowed
                  ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : isSelected
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-xs cursor-pointer'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{sender.name}</span>
                    {sender.isDefault && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-normal">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
                    {sender.email}
                  </div>
                </div>

                {/* Selection Indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
              </div>

              {/* Verification Status Badge */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                {sender.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Đã Xác Thực DKIM/SPF</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Chưa Xác Thực DNS (Không khả dụng)</span>
                  </span>
                )}

                <span className="font-mono text-slate-400">@{sender.domain}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SenderSelector
