import React, { useState } from 'react'
import { XCircle, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/Dialog'
import { Button } from '../../ui/Button'
import { Textarea } from '../../ui/Textarea'
import { FormField, FormLabel } from '../../ui/FormGroup'

export interface RejectCampaignDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirmReject: (reason: string) => Promise<void> | void
  campaignName: string
}

const PRESET_REASONS = [
  'Tiêu đề email chứa từ khóa nhạy cảm có nguy cơ tăng điểm spam',
  'Cần bổ sung hoặc sửa lỗi các biến cá nhân hóa {{firstName}}',
  'Hình ảnh và kích thước tệp đính kèm vượt quá dung lượng khuyến nghị',
  'Chưa tuân thủ đúng hướng dẫn quy chuẩn nhận diện thương hiệu công ty',
]

export const RejectCampaignDialog: React.FC<RejectCampaignDialogProps> = ({
  isOpen,
  onClose,
  onConfirmReject,
  campaignName,
}) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối để tác giả có thể chỉnh sửa chính xác.')
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirmReject(reason.trim())
      setReason('')
      setError(null)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectPreset = (pReason: string) => {
    setReason(pReason)
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <XCircle className="w-5 h-5" />
            <DialogTitle>Từ Chối Phê Duyệt Chiến Dịch</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Chiến dịch "{campaignName}" sẽ được chuyển về trạng thái REJECTED để tác giả chỉnh sửa và gửi duyệt lại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Quick preset suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              Gợi ý lý do từ chối nhanh:
            </span>
            <div className="flex flex-col gap-1.5">
              {PRESET_REASONS.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(r)}
                  className="text-left p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  • {r}
                </button>
              ))}
            </div>
          </div>

          {/* Mandatory Reason Textarea */}
          <FormField>
            <FormLabel required>Lý Do Từ Chối (Bắt buộc)</FormLabel>
            <Textarea
              rows={3}
              value={reason}
              hasError={Boolean(error)}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Giải thích chi tiết các điểm cần chỉnh sửa..."
            />
            {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
          </FormField>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Lý do này sẽ hiển thị trực tiếp cho người tạo chiến dịch.</span>
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
            onClick={handleReject}
          >
            Xác Nhận Từ Chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RejectCampaignDialog
