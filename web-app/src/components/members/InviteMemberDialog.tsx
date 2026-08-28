import React, { useState } from 'react'
import { UserPlus, Mail, ShieldCheck } from 'lucide-react'
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
import { RoleSelector } from './RoleSelector'
import type { WorkspaceRole } from '../../permissions/roles'

export interface InviteMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (email: string, role: WorkspaceRole) => void | Promise<void>
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('CAMPAIGN_EDITOR')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }

    setIsSubmitting(true)
    try {
      await onInvite(email.trim(), role)
      setEmail('')
      setRole('CAMPAIGN_EDITOR')
      setError(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi thư mời.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <UserPlus className="w-5 h-5" />
            <DialogTitle>Mời Thành Viên Mới Vào Tổ Chức</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Hệ thống sẽ gửi email thư mời kích hoạt tài khoản kèm vai trò và quyền hạn được chỉ định.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Email input */}
          <FormField>
            <FormLabel required>Địa Chỉ Email Thành Viên</FormLabel>
            <Input
              type="email"
              placeholder="dongnghiep@congty.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              hasError={!!error}
              autoFocus
            />
            {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
          </FormField>

          {/* Role selector */}
          <div className="space-y-2">
            <FormLabel required>Chỉ Định Vai Trò (Role & Permissions)</FormLabel>
            <RoleSelector selectedRole={role} onSelectRole={setRole} excludeOwner />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Thành viên sẽ được cấp quyền theo ma trận RBAC sau khi chấp nhận lời mời.</span>
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
            isLoading={isSubmitting}
            onClick={handleInvite}
          >
            Gửi Thư Mời Tham Gia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InviteMemberDialog
