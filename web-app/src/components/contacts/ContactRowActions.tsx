import React from 'react'
import { Eye, Edit3, ListPlus, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu'
import { PermissionGate, PERMISSIONS } from '../../permissions'
import type { Permission } from '../../permissions'
import type { Contact } from '../../types/contact.types'

export interface ContactRowActionsProps {
  contact: Contact
  onView?: (contact: Contact) => void
  onEdit?: (contact: Contact) => void
  onAddToList?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
  deleteLabel?: string
  deletePermission?: Permission
}

export const ContactRowActions: React.FC<ContactRowActionsProps> = ({
  contact,
  onView,
  onEdit,
  onAddToList,
  onDelete,
  deleteLabel = 'Xóa liên hệ',
  deletePermission = PERMISSIONS.CONTACT_DELETE,
}) => {
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {/* Quick View Button */}
      <button
        type="button"
        onClick={() => onView?.(contact)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        title="Xem chi tiết"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>

      {/* More Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Tùy chọn khác"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 text-xs">
          <DropdownMenuItem onClick={() => onView?.(contact)}>
            <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" />
            <span>Xem hồ sơ liên hệ</span>
          </DropdownMenuItem>

          <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
            <DropdownMenuItem onClick={() => onEdit?.(contact)}>
              <Edit3 className="w-3.5 h-3.5 mr-2 text-blue-600" />
              <span>Chỉnh sửa thông tin</span>
            </DropdownMenuItem>
          </PermissionGate>

          {onAddToList && (
            <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
              <DropdownMenuItem onClick={() => onAddToList(contact)}>
                <ListPlus className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                <span>Thêm vào danh sách</span>
              </DropdownMenuItem>
            </PermissionGate>
          )}

          {onDelete && (
            <PermissionGate permission={deletePermission}>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(contact)}
                className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 focus:text-rose-600 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                <span>{deleteLabel}</span>
              </DropdownMenuItem>
            </PermissionGate>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default ContactRowActions
