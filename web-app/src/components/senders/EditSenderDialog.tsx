import React, { useState, useEffect } from 'react'
import { Edit3, User, Mail } from 'lucide-react'
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
import type { VerifiedSender } from '../../types/sender.types'

export interface EditSenderDialogProps {
  isOpen: boolean
  onClose: () => void
  sender: VerifiedSender | null
  onSave: (senderId: string, newName: string) => void
}

export const EditSenderDialog: React.FC<EditSenderDialogProps> = ({
  isOpen,
  onClose,
  sender,
  onSave,
}) => {
  if (!sender) return null

  const [name, setName] = useState(sender.name)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setName(sender.name)
    setError(null)
  }, [sender])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên người gửi.')
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsSubmitting(false)
    onSave(sender.id, name.trim())
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <DialogTitle>Chỉnh Sửa Tên Người Gửi</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Cập nhật tên hiển thị người gửi thư cho địa chỉ <strong>{sender.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <FormField>
            <FormLabel required>Tên Người Gửi Hiển Thị</FormLabel>
            <Input
              placeholder="Tên người gửi..."
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              hasError={!!error}
              autoFocus
            />
            {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
          </FormField>

          <FormField>
            <FormLabel>Địa Chỉ Email (Không thể thay đổi)</FormLabel>
            <Input
              value={sender.email}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              disabled
              readOnly
              className="bg-slate-100 dark:bg-slate-800 text-slate-500"
            />
          </FormField>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleSave}
          >
            Lưu Thay Đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditSenderDialog
