import React, { useState } from 'react'
import { Send, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { FormField, FormLabel } from '../ui/FormGroup'
import { useToast } from '../ui/Toast'

export interface SendTestDialogProps {
  isOpen: boolean
  onClose: () => void
  templateName: string
  subject: string
}

export const SendTestDialog: React.FC<SendTestDialogProps> = ({
  isOpen,
  onClose,
  templateName,
  subject,
}) => {
  const { showToast } = useToast()
  const [recipientEmail, setRecipientEmail] = useState('developer@mailflow.vn')
  const [testFirstName, setTestFirstName] = useState('Thành')
  const [testCompany, setTestCompany] = useState('V-Corp Global')
  const [isSending, setIsSending] = useState(false)

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientEmail.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập email nhận',
        description: 'Vui lòng nhập địa chỉ email nhận bản thử nghiệm.',
      })
      return
    }

    setIsSending(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSending(false)

    showToast({
      type: 'success',
      title: 'Đã gửi email thử nghiệm',
      description: `Bản test mẫu "${templateName}" đã được gửi tới ${recipientEmail} thành công.`,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSendTest}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <DialogTitle>Gửi Thử Nghiệm (Send Test Email)</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Gửi một bản xem trước với dữ liệu mẫu thực tế vào hộp thư cá nhân để kiểm tra hiển thị trên thiết bị thực.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <FormField>
              <FormLabel required>Gửi Đến Hộp Thư</FormLabel>
              <Input
                type="email"
                placeholder="tenban@congty.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField>
                <FormLabel>Dữ liệu mẫu: Tên</FormLabel>
                <Input
                  value={testFirstName}
                  onChange={(e) => setTestFirstName(e.target.value)}
                  placeholder="Thành"
                />
              </FormField>
              <FormField>
                <FormLabel>Dữ liệu mẫu: Công ty</FormLabel>
                <Input
                  value={testCompany}
                  onChange={(e) => setTestCompany(e.target.value)}
                  placeholder="V-Corp"
                />
              </FormField>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 space-y-1">
              <div>Tiêu đề gửi thử nghiệm:</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                [TEST] {subject || 'Chưa có tiêu đề'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSending}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Gửi Ngay
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SendTestDialog
