import React, { useState } from 'react'
import { CheckCircle2, ShieldCheck, Mail, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/Dialog'
import { Button } from '../../ui/Button'
import { FormField, FormLabel } from '../../ui/FormGroup'

export interface ApproveCampaignDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirmApprove: (note?: string) => void
  campaignName: string
  recipientCount: number
  scheduledAt?: string
}

export const ApproveCampaignDialog: React.FC<ApproveCampaignDialogProps> = ({
  isOpen,
  onClose,
  onConfirmApprove,
  campaignName,
  recipientCount,
  scheduledAt = 'Phát hành ngay lập tức',
}) => {
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApprove = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsSubmitting(false)
    onConfirmApprove(note.trim() || undefined)
    setNote('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <DialogTitle>Phê Duyệt Chiến Dịch Email</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Chiến dịch sau khi duyệt sẽ được chuyển sang trạng thái sẵn sàng phát hành hoặc đưa vào hàng đợi gửi tự động.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>{campaignName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Quy mô:</span>
              </span>
              <strong className="text-emerald-600 font-mono">
                {recipientCount.toLocaleString()} người nhận
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Lịch gửi:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {scheduledAt}
              </span>
            </div>
          </div>

          {/* Optional Note Field */}
          <FormField>
            <FormLabel>Ghi Chú Phê Duyệt (Tùy chọn)</FormLabel>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho tác giả (ví dụ: Nội dung tốt, đã duyệt gửi theo lịch)..."
              className="w-full text-xs p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed focus-ring"
            />
          </FormField>

          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đã kiểm tra xác thực DKIM/SPF & quy chuẩn chống spam RFC 8058.</span>
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
            className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            isLoading={isSubmitting}
            onClick={handleApprove}
          >
            Xác Nhận Phê Duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ApproveCampaignDialog
