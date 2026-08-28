import React, { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../ui/Toast'
import { useWorkspace } from '../../context/WorkspaceContext'
import { ApiError } from '../../services/apiClient'
import { cn } from '../../utils/cn'

export interface AcceptInviteFormProps {
  className?: string
  onAccepted?: () => void
}

export const AcceptInviteForm: React.FC<AcceptInviteFormProps> = ({ className, onAccepted }) => {
  const { acceptInvitation } = useWorkspace()
  const { showToast } = useToast()
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAccept = async () => {
    const value = token.trim()
    if (!value) {
      showToast({
        type: 'warning',
        title: 'Thiếu mã lời mời',
        description: 'Vui lòng dán mã nhận được trong email thư mời.',
      })
      return
    }
    setIsSubmitting(true)
    try {
      const res = await acceptInvitation(value)
      setToken('')
      showToast({
        type: 'success',
        title: 'Đã chấp nhận lời mời',
        description: `Bạn đã tham gia workspace ${res.workspaceName}.`,
      })
      onAccepted?.()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không chấp nhận được lời mời',
        description: error instanceof ApiError ? error.detail : 'Mã không hợp lệ, đã hết hạn, hoặc email tài khoản không khớp.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-left space-y-2', className)}>
      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
        Dán mã lời mời từ email:
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Dán mã token tại đây..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="text-xs font-mono w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAccept()
              }
            }}
          />
        </div>
        <Button
          size="sm"
          variant="primary"
          className="shrink-0 px-3.5 font-semibold text-xs h-[38px]"
          isLoading={isSubmitting}
          onClick={() => void handleAccept()}
        >
          Tham gia
        </Button>
      </div>
      <p className="text-[10px] text-slate-400">
        Đăng nhập đúng email được mời. Mã có hiệu lực 7 ngày.
      </p>
    </div>
  )
}

export default AcceptInviteForm
