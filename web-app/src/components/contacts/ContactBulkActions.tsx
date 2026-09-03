import React from 'react'
import { CheckSquare, ListPlus, Tag, Download, Trash2, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { PermissionGate, PERMISSIONS } from '../../permissions'

export interface ContactBulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
  onAddToList?: () => void
  onAddTag?: () => void
  onExportSelected?: () => void
  onDeleteSelected?: () => void
  isExporting?: boolean
  className?: string
}

export const ContactBulkActions: React.FC<ContactBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onAddToList,
  onAddTag,
  onExportSelected,
  onDeleteSelected,
  isExporting = false,
  className,
}) => {
  if (selectedCount === 0) return null

  return (
    <div
      className={`sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25 animate-in slide-in-from-top-2 duration-200 ${
        className || ''
      }`}
    >
      {/* Left: Selection Counter */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold font-mono text-xs">
          <CheckSquare className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm font-bold">
          Đã chọn <span className="underline font-mono">{selectedCount}</span> liên hệ
        </div>
      </div>

      {/* Right: Bulk Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Add to List */}
        <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddToList}
            className="text-white hover:bg-white/15 text-xs font-semibold"
            leftIcon={<ListPlus className="w-3.5 h-3.5" />}
          >
            Thêm Vào Danh Sách
          </Button>
        </PermissionGate>

        {/* Add Tag */}
        <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddTag}
            className="text-white hover:bg-white/15 text-xs font-semibold"
            leftIcon={<Tag className="w-3.5 h-3.5" />}
          >
            Gán Thẻ Tag
          </Button>
        </PermissionGate>

        {/* Export Selected */}
        <PermissionGate permission={PERMISSIONS.CONTACT_EXPORT}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExportSelected}
            isLoading={isExporting}
            disabled={isExporting}
            className="text-white hover:bg-white/15 text-xs font-semibold"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Xuất Excel
          </Button>
        </PermissionGate>

        {/* Delete Selected */}
        <PermissionGate permission={PERMISSIONS.CONTACT_DELETE}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDeleteSelected}
            className="bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-bold"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Xóa ({selectedCount})
          </Button>
        </PermissionGate>

        {/* Deselect All */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          title="Bỏ chọn tất cả"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ContactBulkActions
