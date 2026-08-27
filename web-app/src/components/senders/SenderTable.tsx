import React, { useState } from 'react'
import {
  MoreVertical,
  Send,
  Edit3,
  Trash2,
  Globe,
  Star,
} from 'lucide-react'
import { SenderStatusBadge } from './SenderStatusBadge'
import { Button } from '../ui/Button'
import { usePermission, PERMISSIONS } from '../../permissions'
import type { VerifiedSender } from '../../types/sender.types'

export interface SenderTableProps {
  senders: VerifiedSender[]
  onEditSender: (sender: VerifiedSender) => void
  onDeleteSender: (sender: VerifiedSender) => void
  onResendVerification: (sender: VerifiedSender) => void
  onSetDefault?: (sender: VerifiedSender) => void
}

export const SenderTable: React.FC<SenderTableProps> = ({
  senders,
  onEditSender,
  onDeleteSender,
  onResendVerification,
  onSetDefault,
}) => {
  const { hasPermission } = usePermission()
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const canManage = hasPermission(PERMISSIONS.SENDER_MANAGE)

  if (senders.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Chưa có địa chỉ người gửi nào trong danh sách.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">Tên Người Gửi</th>
            <th className="py-3 px-4">Địa Chỉ Email</th>
            <th className="py-3 px-4">Trạng Thái Xác Minh</th>
            <th className="py-3 px-4">Xác Thực Tên Miền</th>
            <th className="py-3 px-4">Ngày Tạo</th>
            <th className="py-3 px-4 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {senders.map((s) => {
            const senderStatus = s.status || (s.isVerified ? 'VERIFIED' : 'PENDING')
            const isVerified = senderStatus === 'VERIFIED'
            const isPending = senderStatus === 'PENDING'

            return (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                {/* Sender Name */}
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {s.isDefault && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[9px] font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        <span>Mặc định</span>
                      </span>
                    )}
                  </div>
                </td>

                {/* Email Address */}
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 font-semibold">
                  {s.email}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-4">
                  <SenderStatusBadge status={senderStatus} />
                </td>

                {/* Domain Authentication status */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>{s.domain}</span>
                    </span>
                    {s.dkimStatus === 'verified' && (
                      <span className="text-[10px] text-emerald-600 font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50">
                        DKIM & SPF OK
                      </span>
                    )}
                  </div>
                </td>

                {/* Created Date */}
                <td className="py-3 px-4 text-slate-500 font-mono">{s.createdAt}</td>

                {/* Actions Context Menu */}
                <td className="py-3 px-4 text-center relative">
                  <div className="flex items-center justify-center gap-1">
                    {/* Quick Resend button if pending */}
                    {isPending && canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-blue-600 text-xs"
                        leftIcon={<Send className="w-3 h-3" />}
                        onClick={() => onResendVerification(s)}
                        title="Gửi lại email xác thực"
                      >
                        Gửi Lại Mã
                      </Button>
                    )}

                    {canManage && (
                      <div className="relative inline-block text-left">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                        >
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </Button>

                        {/* Dropdown menu */}
                        {activeMenuId === s.id && (
                          <div
                            className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in-0"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <button
                              type="button"
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                              onClick={() => onEditSender(s)}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Sửa Tên Người Gửi</span>
                            </button>

                            {isVerified && !s.isDefault && onSetDefault && (
                              <button
                                type="button"
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-amber-700 dark:text-amber-300 cursor-pointer"
                                onClick={() => onSetDefault(s)}
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                <span>Đặt Làm Mặc Định</span>
                              </button>
                            )}

                            {!isVerified && (
                              <button
                                type="button"
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-blue-600 cursor-pointer"
                                onClick={() => onResendVerification(s)}
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Gửi Lại Xác Thực</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                              onClick={() => onDeleteSender(s)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Xóa Người Gửi</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SenderTable
