import React, { useState } from 'react'
import { ShieldAlert, ArrowRight, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { RoleSelector } from './RoleSelector'
import { RoleBadge } from './RoleBadge'
import type { WorkspaceMember } from '../../types/member.types'
import type { WorkspaceRole } from '../../permissions/roles'

export interface ChangeRoleDialogProps {
  isOpen: boolean
  onClose: () => void
  member: WorkspaceMember | null
  onConfirmChange: (memberId: string, newRole: WorkspaceRole) => void
}

const ROLE_PERMISSIONS_SUMMARY: Record<WorkspaceRole, { keyAbilities: string[] }> = {
  OWNER: {
    keyAbilities: [
      'Toàn quyền xóa Workspace',
      'Chuyển giao quyền sở hữu',
      'Thay đổi vai trò của mọi thành viên',
    ],
  },
  ADMIN: {
    keyAbilities: [
      'Mời & quản lý thành viên',
      'Phê duyệt & phát hành chiến dịch trực tiếp',
      'Cấu hình tên miền DKIM & API keys',
    ],
  },
  MARKETING_MANAGER: {
    keyAbilities: [
      'Phê duyệt chiến dịch của Editor',
      'Phát hành email trực tiếp',
      'Xuất báo cáo phân tích',
    ],
  },
  CAMPAIGN_EDITOR: {
    keyAbilities: [
      'Tạo & soạn thảo chiến dịch',
      'Gửi yêu cầu phê duyệt (Submit for Approval)',
      'Không thể phát hành trực tiếp',
    ],
  },
  CONTACT_MANAGER: {
    keyAbilities: [
      'Nhập & xuất tệp liên hệ CSV/XLSX',
      'Quản lý danh sách & phân đoạn động',
      'Không thể gửi email chiến dịch',
    ],
  },
  ANALYST: {
    keyAbilities: [
      'Xem dashboard & báo cáo số liệu',
      'Xuất file phân tích CSV/PDF',
      'Không thể chỉnh sửa danh bạ hoặc nội dung',
    ],
  },
  BILLING_MANAGER: {
    keyAbilities: [
      'Quản lý hóa đơn & thanh toán',
      'Nâng cấp gói Dedicated IP',
      'Không thể tạo chiến dịch marketing',
    ],
  },
  VIEWER: {
    keyAbilities: [
      'Chỉ xem thông tin cơ bản',
      'Không thể thay đổi dữ liệu hoặc phát hành',
    ],
  },
}

export const ChangeRoleDialog: React.FC<ChangeRoleDialogProps> = ({
  isOpen,
  onClose,
  member,
  onConfirmChange,
}) => {
  if (!member) return null

  const [newRole, setNewRole] = useState<WorkspaceRole>(member.role)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const newSummary = ROLE_PERMISSIONS_SUMMARY[newRole]
  const isSameRole = member.role === newRole

  const handleConfirm = async () => {
    if (isSameRole) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsSubmitting(false)
    onConfirmChange(member.id, newRole)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <DialogTitle>Thay Đổi Vai Trò Thành Viên</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Điều chỉnh cấp độ phân quyền cho thành viên <strong>{member.name}</strong> ({member.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Comparison Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Vai Trò Hiện Tại:</span>
              <div><RoleBadge role={member.role} /></div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            <div className="space-y-1 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Vai Trò Mới:</span>
              <div><RoleBadge role={newRole} /></div>
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Chọn Vai Trò Mới:</span>
            <RoleSelector
              selectedRole={newRole}
              onSelectRole={setNewRole}
              disabledRoles={['OWNER']}
              excludeOwner
            />
          </div>

          {/* Notable Permissions Impact Callout */}
          {!isSameRole && (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                <span>Thay Đổi Quyền Hạn Đáng Chú Ý:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-blue-800/90 dark:text-blue-300 pl-4 list-disc">
                {newSummary.keyAbilities.map((ab, idx) => (
                  <li key={idx}>{ab}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isSameRole}
            isLoading={isSubmitting}
            onClick={handleConfirm}
          >
            Cập Nhật Vai Trò Mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ChangeRoleDialog
