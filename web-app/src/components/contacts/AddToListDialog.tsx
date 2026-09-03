import React, { useEffect, useMemo, useState } from 'react'
import { Layers, Search, ListPlus } from 'lucide-react'
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
import type { AudienceList } from '../../types/list.types'

export interface AddToListDialogProps {
  isOpen: boolean
  onClose: () => void
  lists: AudienceList[]
  contactCount: number
  onConfirm: (list: AudienceList) => Promise<void>
}

export const AddToListDialog: React.FC<AddToListDialogProps> = ({
  isOpen,
  onClose,
  lists,
  contactCount,
  onConfirm,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setSearchQuery('')
    setSelectedListId(null)
    setIsSubmitting(false)
  }, [isOpen])

  const filteredLists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return lists
    }
    return lists.filter(
      (list) =>
        list.name.toLowerCase().includes(q) ||
        (list.description || '').toLowerCase().includes(q)
    )
  }, [lists, searchQuery])

  const handleConfirm = async () => {
    const picked = lists.find((list) => list.id === selectedListId)
    if (!picked) {
      return
    }
    setIsSubmitting(true)
    try {
      await onConfirm(picked)
      onClose()
    } catch {
      // Parent shows toast; keep dialog open for retry.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ListPlus className="w-5 h-5 text-emerald-600" />
            <DialogTitle>Thêm Vào Danh Sách</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Chọn danh sách để gán{' '}
            <strong className="font-mono text-slate-800 dark:text-slate-200">
              {contactCount.toLocaleString('vi-VN')}
            </strong>{' '}
            liên hệ đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <Input
            placeholder="Tìm danh sách..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLists.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <Layers className="w-5 h-5 mx-auto text-slate-400" />
                <div>
                  {lists.length === 0
                    ? 'Chưa có danh sách nào. Hãy tạo danh sách trước.'
                    : 'Không tìm thấy danh sách phù hợp.'}
                </div>
              </div>
            ) : (
              filteredLists.map((list) => {
                const selected = selectedListId === list.id
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full text-left px-3.5 py-3 transition cursor-pointer ${
                      selected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                          selected
                            ? 'border-emerald-600 bg-emerald-600 shadow-[inset_0_0_0_2px_white]'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {list.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {list.description || `${list.contactCount.toLocaleString('vi-VN')} liên hệ`}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {list.contactCount.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={!selectedListId}
            leftIcon={<ListPlus className="w-3.5 h-3.5" />}
            onClick={() => void handleConfirm()}
          >
            Thêm Vào Danh Sách
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddToListDialog
