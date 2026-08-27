import React, { useState } from 'react'
import {
  MoreVertical,
  ShieldAlert,
  Trash2,
  Send,
  XCircle,
  Crown,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react'
import { RoleBadge } from './RoleBadge'
import { Button } from '../ui/Button'
import { usePermission, PERMISSIONS } from '../../permissions'
import type { WorkspaceMember } from '../../types/member.types'

export interface MemberTableProps {
  members: WorkspaceMember[]
  currentUserRole: string
  onChangeRole: (member: WorkspaceMember) => void
  onRemoveMember: (member: WorkspaceMember) => void
  onResendInvite: (member: WorkspaceMember) => void
  onCancelInvite: (member: WorkspaceMember) => void
  onTransferOwnership?: (member: WorkspaceMember) => void
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  currentUserRole,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvite,
  onTransferOwnership,
}) => {
  const { hasPermission } = usePermission()
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const isOwner = currentUserRole === 'OWNER'
  const canUpdate = hasPermission(PERMISSIONS.MEMBER_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.MEMBER_DELETE)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">Thành Viên</th>
            <th className="py-3 px-4">Email</th>
            <th className="py-3 px-4">Vai Trò</th>
            <th className="py-3 px-4">Trạng Thái</th>
            <th className="py-3 px-4">Ngày Tham Gia</th>
            <th className="py-3 px-4">Hoạt Động Cuối</th>
            <th className="py-3 px-4 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => {
            const isTargetOwner = m.role === 'OWNER'
            const isSelf = m.isCurrentUser
            const isPending = m.status === 'PENDING'

            return (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                {/* Name + Avatar */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[9px] font-bold">
                            Bạn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                  {m.email}
                </td>

                {/* Role */}
                <td className="py-3 px-4">
                  <RoleBadge role={m.role} />
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  {m.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đang Hoạt Động</span>
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Chờ Kích Hoạt</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                      <Ban className="w-3.5 h-3.5" />
                      <span>Vô Hiệu Hóa</span>
                    </span>
                  )}
                </td>

                {/* Joined */}
                <td className="py-3 px-4 text-slate-500 font-mono">{m.joinedAt}</td>

                {/* Last Active */}
                <td className="py-3 px-4 text-slate-500 font-mono">{m.lastActiveAt}</td>

                {/* Actions Context Menu */}
                <td className="py-3 px-4 text-center relative">
                  {isPending ? (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-blue-600 text-xs"
                        leftIcon={<Send className="w-3 h-3" />}
                        onClick={() => onResendInvite(m)}
                        title="Gửi lại thư mời"
                      >
                        Gửi Lại
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-rose-600 text-xs"
                        leftIcon={<XCircle className="w-3 h-3" />}
                        onClick={() => onCancelInvite(m)}
                        title="Hủy thư mời"
                      >
                        Hủy
                      </Button>
                    </div>
                  ) : isTargetOwner ? (
                    <span className="text-[11px] text-slate-400 italic">Chủ sở hữu</span>
                  ) : isSelf ? (
                    <span className="text-[11px] text-slate-400 italic">Tài khoản của bạn</span>
                  ) : (
                    <div className="relative inline-block text-left">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                      >
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                      </Button>

                      {/* Dropdown Menu */}
                      {activeMenuId === m.id && (
                        <div
                          className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in-0"
                          onClick={() => setActiveMenuId(null)}
                        >
                          {canUpdate && (
                            <button
                              type="button"
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                              onClick={() => onChangeRole(m)}
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                              <span>Đổi Vai Trò</span>
                            </button>
                          )}

                          {isOwner && onTransferOwnership && (
                            <button
                              type="button"
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-amber-700 dark:text-amber-300 cursor-pointer"
                              onClick={() => onTransferOwnership(m)}
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>Chuyển Quyền Owner</span>
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                              onClick={() => onRemoveMember(m)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Xóa Thành Viên</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default MemberTable
