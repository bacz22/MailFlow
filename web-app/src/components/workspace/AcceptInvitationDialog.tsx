import React from 'react'
import { MailPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/Dialog'
import { AcceptInviteForm } from './AcceptInviteForm'

export interface AcceptInvitationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const AcceptInvitationDialog: React.FC<AcceptInvitationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <MailPlus className="w-5 h-5" />
            <DialogTitle>Tham Gia Workspace Bằng Mã Lời Mời</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Dán mã token trong email thư mời (phần “Hoặc dán mã này sau khi đăng nhập”) để tham gia workspace.
          </DialogDescription>
        </DialogHeader>
        <AcceptInviteForm onAccepted={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default AcceptInvitationDialog
