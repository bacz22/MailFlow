import React from 'react'
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
import { Pagination } from '../ui/Pagination'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu'
import { usePermission, PERMISSIONS } from '../../permissions'
import type { VerifiedSender } from '../../types/sender.types'

export interface SenderTableProps {
  senders: VerifiedSender[]
  onEditSender: (sender: VerifiedSender) => void
  onDeleteSender: (sender: VerifiedSender) => void
  onResendVerification: (sender: VerifiedSender) => void
  onSetDefault?: (sender: VerifiedSender) => void
  defaultPageSize?: number
  pageSizeOptions?: number[]
}

export const SenderTable: React.FC<SenderTableProps> = ({
  senders,
  onEditSender,
  onDeleteSender,
  onResendVerification,
  onSetDefault,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const { hasPermission } = usePermission()
  const canManage = hasPermission(PERMISSIONS.SENDER_MANAGE)

  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(defaultPageSize)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [senders])

  if (senders.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Chưa có địa chỉ người gửi nào trong danh sách.
      </div>
    )
  }

  const totalItems = senders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedSenders = senders.slice(startIndex, startIndex + pageSize)

  return (
    <div>
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
            {paginatedSenders.map((s) => {
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Tùy chọn thao tác"
                            aria-label="Tùy chọn thao tác"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs">
                          <DropdownMenuItem onClick={() => onEditSender(s)}>
                            <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                            <span>Sửa</span>
                          </DropdownMenuItem>

                          {isVerified && !s.isDefault && onSetDefault && (
                            <DropdownMenuItem onClick={() => onSetDefault(s)}>
                              <Star className="w-3.5 h-3.5 mr-2 text-amber-500" />
                              <span>Đặt Làm Mặc Định</span>
                            </DropdownMenuItem>
                          )}

                          {!isVerified && (
                            <DropdownMenuItem onClick={() => onResendVerification(s)}>
                              <Send className="w-3.5 h-3.5 mr-2 text-blue-600" />
                              <span>Gửi Lại Xác Thực</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteSender(s)}
                            className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            <span>Xóa</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        itemLabel="người gửi"
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />
    </div>
  )
}

export default SenderTable
