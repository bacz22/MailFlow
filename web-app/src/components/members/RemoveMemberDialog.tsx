import React, { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import type { WorkspaceMember } from '../../types/member.types'

export interface RemoveMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  member: WorkspaceMember | null
  onConfirmRemove: (memberId: string) => void
}

export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({
  isOpen,
  onClose,
  member,
  onConfirmRemove,
}) => {
  if (!member) return null

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsSubmitting(false)
    onConfirmRemove(member.id)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <Trash2 className="w-5 h-5" />
            <DialogTitle>Xóa Thành Viên Khỏi Tổ Chức</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Bạn có chắc chắn muốn thu hồi quyền truy cập của thành viên{' '}
            <strong>{member.name}</strong> ({member.email}) không?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Hành Động Này Không Thể Hoàn Tác:</span>
            </div>
            <p className="text-[11px] leading-relaxed pl-5">
              Mọi phiên đăng nhập hiện tại và quyền truy cập vào danh bạ, chiến dịch, API key của thành viên này sẽ bị chấm dứt ngay lập tức.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 font-bold"
            isLoading={isSubmitting}
            onClick={handleConfirm}
          >
            Xác Nhận Xóa Thành Viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RemoveMemberDialog
