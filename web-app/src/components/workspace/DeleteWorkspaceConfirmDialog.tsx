import React, { useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormField, FormLabel } from '../ui/FormGroup'

export interface DeleteWorkspaceConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceName: string
  onConfirmDelete: () => void
}

export const DeleteWorkspaceConfirmDialog: React.FC<DeleteWorkspaceConfirmDialogProps> = ({
  isOpen,
  onClose,
  workspaceName,
  onConfirmDelete,
}) => {
  const [confirmInput, setConfirmInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isMatched = confirmInput.trim() === workspaceName.trim()

  const handleDelete = async () => {
    if (!isMatched) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)
    onConfirmDelete()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <DialogTitle>Xóa Toàn Bộ Không Gian Làm Việc?</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Hành động này mang tính chất vĩnh viễn và không thể khôi phục dữ liệu dưới bất kỳ hình thức nào.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Consequences List */}
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Các Dữ Liệu Sau Sẽ Bị Hủy Diệt Ngay Lập Tức:</span>
            </div>
            <ul className="space-y-1 text-[11px] pl-4 list-disc text-rose-800/90 dark:text-rose-300">
              <li>Toàn bộ danh bạ liên hệ và phân đoạn khách hàng.</li>
              <li>Tất cả chiến dịch, mẫu email và nhật ký gửi thư.</li>
              <li>Cấu hình tên miền DKIM/SPF và IP Dedicated được gán.</li>
              <li>Hủy bỏ gói đăng ký thanh toán tự động hàng tháng.</li>
            </ul>
          </div>

          {/* Typing confirmation */}
          <FormField>
            <FormLabel required>
              Nhập chính xác tên <strong>{workspaceName}</strong> để xác nhận:
            </FormLabel>
            <Input
              placeholder={workspaceName}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              hasError={confirmInput.length > 0 && !isMatched}
              autoFocus
            />
          </FormField>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 font-bold"
            disabled={!isMatched}
            isLoading={isSubmitting}
            onClick={handleDelete}
          >
            Tôi Hiểu Hậu Quả, Xóa Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteWorkspaceConfirmDialog
