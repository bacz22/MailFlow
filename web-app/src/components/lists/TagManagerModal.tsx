import React, { useState } from 'react'
import { Tag, Plus, Trash2, Edit3, Check, X } from 'lucide-react'
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
import { useToast } from '../ui/Toast'
import type { AudienceTag } from '../../types/list.types'

export interface TagManagerModalProps {
  isOpen: boolean
  onClose: () => void
  tags: AudienceTag[]
  onUpdateTags: (tags: AudienceTag[]) => void
}

// Accessible high-contrast color presets
export const ACCESSIBLE_TAG_COLORS = [
  { label: 'Blue', value: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  { label: 'Emerald', value: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { label: 'Indigo', value: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  { label: 'Violet', value: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  { label: 'Amber', value: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { label: 'Teal', value: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  { label: 'Rose', value: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
]

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  tags,
  onUpdateTags,
}) => {
  const { showToast } = useToast()
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(ACCESSIBLE_TAG_COLORS[0].value)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')

  const handleCreateTag = () => {
    const trimmed = newTagName.trim().replace(/^#/, '')
    if (!trimmed) return

    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast({
        type: 'warning',
        title: 'Thẻ đã tồn tại',
        description: `Thẻ "#${trimmed}" đã có trong hệ thống.`,
      })
      return
    }

    const newTag: AudienceTag = {
      id: `tag-${Date.now()}`,
      name: trimmed,
      color: selectedColor,
      contactCount: 0,
      createdAt: 'Vừa tạo',
    }

    onUpdateTags([...tags, newTag])
    setNewTagName('')
    showToast({
      type: 'success',
      title: 'Đã tạo thẻ mới',
      description: `Đã thêm thẻ #${trimmed} thành công.`,
    })
  }

  const handleDeleteTag = (id: string, name: string) => {
    onUpdateTags(tags.filter((t) => t.id !== id))
    showToast({
      type: 'warning',
      title: 'Đã xóa thẻ',
      description: `Đã xóa thẻ #${name} khỏi không gian làm việc.`,
    })
  }

  const handleSaveEdit = (id: string) => {
    if (!editingTagName.trim()) return
    onUpdateTags(
      tags.map((t) => (t.id === id ? { ...t, name: editingTagName.trim().replace(/^#/, '') } : t))
    )
    setEditingTagId(null)
    setEditingTagName('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <DialogTitle>Quản Lý Thẻ Phân Khúc (Tags Management)</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Tạo và quản lý các nhãn phân loại khách hàng để phục vụ gửi chiến dịch cá nhân hóa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Create New Tag Input Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tạo Thẻ Tag Mới:
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Nhập tên thẻ (ví dụ: VIP, Churn Risk)..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateTag()
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!newTagName.trim()}
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleCreateTag}
              >
                Tạo
              </Button>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-500">Màu hiển thị (Đã chuẩn hóa tương phản):</div>
              <div className="flex items-center gap-2 flex-wrap">
                {ACCESSIBLE_TAG_COLORS.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                      c.value
                    } ${selectedColor === c.value ? 'ring-2 ring-blue-500 shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                  >
                    {selectedColor === c.value && <Check className="w-3 h-3" />}
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Existing Tags List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Danh Sách Thẻ Hiện Có ({tags.length}):
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {tags.map((tag) => {
                const isEditing = editingTagId === tag.id

                return (
                  <div
                    key={tag.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="h-8 text-xs"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(tag.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTagId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${tag.color}`}
                        >
                          <Tag className="w-3 h-3" />
                          <span>#{tag.name}</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {tag.contactCount.toLocaleString()} liên hệ
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTagId(tag.id)
                            setEditingTagName(tag.name)
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                          title="Đổi tên"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                          title="Xóa thẻ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="primary" size="sm" onClick={onClose}>
            Hoàn Tất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TagManagerModal
