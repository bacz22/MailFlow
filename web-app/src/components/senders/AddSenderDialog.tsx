import React, { useState } from 'react'
import { PlusCircle, Mail, User, ShieldCheck, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ConfirmDialog,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormField, FormLabel } from '../ui/FormGroup'
import { ApiError } from '../../services/apiClient'

export interface AddSenderDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddSender: (name: string, email: string) => Promise<void>
}

export const AddSenderDialog: React.FC<AddSenderDialogProps> = ({
  isOpen,
  onClose,
  onAddSender,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleInitiateSubmit = () => {
    const errs: { name?: string; email?: string } = {}
    if (!name.trim()) errs.name = 'Vui lòng nhập tên hiển thị người gửi.'
    if (!email.trim() || !email.includes('@')) errs.email = 'Vui lòng nhập địa chỉ email hợp lệ.'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    setShowConfirm(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onAddSender(name.trim(), email.trim())
      setName('')
      setEmail('')
      setErrors({})
      setShowConfirm(false)
      onClose()
    } catch (error) {
      setShowConfirm(false)
      if (error instanceof ApiError) {
        if (error.code === 'SENDER_EMAIL_EXISTS' || error.status === 409) {
          setErrors((prev) => ({
            ...prev,
            email: error.detail || error.message || 'Địa chỉ email này đã tồn tại trong workspace.',
          }))
        } else if (error.errors && error.errors.length > 0) {
          const fieldErrs: { name?: string; email?: string } = {}
          error.errors.forEach((fe) => {
            if (fe.field === 'email') fieldErrs.email = fe.message
            if (fe.field === 'name') fieldErrs.name = fe.message
          })
          setErrors(fieldErrs)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <PlusCircle className="w-5 h-5" />
            <DialogTitle>Thêm Địa Chỉ Người Gửi Mới</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Đăng ký địa chỉ email phát hành chiến dịch cho tổ chức của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Display Name Input */}
          <FormField>
            <FormLabel required>Tên Người Gửi Hiển Thị (Sender Name)</FormLabel>
            <Input
              placeholder="Ví dụ: MailFlow Team hoặc Marketing Hub"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              hasError={!!errors.name}
              autoFocus
            />
            {errors.name && (
              <span className="text-[11px] text-rose-500 font-medium">{errors.name}</span>
            )}
          </FormField>

          {/* Email Address Input */}
          <FormField>
            <FormLabel required>Địa Chỉ Email Người Gửi (From Address)</FormLabel>
            <Input
              type="email"
              placeholder="support@tencongty.vn"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              hasError={!!errors.email}
            />
            {errors.email && (
              <span className="text-[11px] text-rose-500 font-medium">{errors.email}</span>
            )}
          </FormField>

          {/* Verification Process Explanation Callout */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-1.5 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Quy Trình Xác Thực Địa Chỉ Thư:</span>
            </div>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300 leading-relaxed pl-5">
              Sau khi tạo, hệ thống sẽ gửi một email xác thực đến địa chỉ trên. Người quản trị cần bấm vào liên kết trong hộp thư để kích hoạt trạng thái <strong>Verified</strong> trước khi có thể sử dụng gửi chiến dịch.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Đảm bảo tên miền của email đã hoàn tất cấu hình bản ghi SPF/DKIM.</span>
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
            onClick={handleInitiateSubmit}
          >
            Đăng Ký
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={showConfirm}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) setShowConfirm(false)
      }}
      title="Xác Nhận Đăng Ký Người Gửi"
      description={`Bạn có chắc chắn muốn đăng ký địa chỉ "${name.trim()}" <${email.trim()}> làm người gửi thư cho tổ chức?`}
      confirmText="Xác nhận & Lưu"
      cancelText="Quay lại"
      variant="primary"
      isLoading={isSubmitting}
      onConfirm={() => void handleConfirmSubmit()}
    />
    </>
  )
}

export default AddSenderDialog
