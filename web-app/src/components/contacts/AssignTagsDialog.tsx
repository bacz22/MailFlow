import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Tag, Plus, X } from 'lucide-react'
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
import { tagService } from '../../services/tag.service'

export interface AssignTagsDialogProps {
  isOpen: boolean
  onClose: () => void
  contactCount: number
  availableTags?: string[]
  initialSelectedTags?: string[]
  onConfirm: (tags: string[]) => Promise<void>
}

const EMPTY_TAGS: string[] = []

function normalizeTag(value: string): string {
  return value.trim().replace(/^#/, '')
}

export const AssignTagsDialog: React.FC<AssignTagsDialogProps> = ({
  isOpen,
  onClose,
  contactCount,
  availableTags = EMPTY_TAGS,
  initialSelectedTags = EMPTY_TAGS,
  onConfirm,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [draftTag, setDraftTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [catalogTags, setCatalogTags] = useState<string[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const initialSelectedTagsRef = useRef(initialSelectedTags)
  initialSelectedTagsRef.current = initialSelectedTags

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setSelectedTags([...initialSelectedTagsRef.current])
    setDraftTag('')
    setIsSubmitting(false)
    let cancelled = false
    setIsLoadingCatalog(true)
    tagService
      .list()
      .then((tags) => {
        if (!cancelled) {
          setCatalogTags(tags.map((tag) => tag.name).filter(Boolean))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogTags([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCatalog(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const suggestionTags = useMemo(() => {
    const selected = new Set(selectedTags.map((tag) => tag.toLowerCase()))
    const merged = new Set<string>([...catalogTags, ...availableTags])
    return Array.from(merged)
      .filter((tag) => tag && !selected.has(tag.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'vi'))
  }, [availableTags, catalogTags, selectedTags])

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw)
    if (!tag) {
      return
    }
    setSelectedTags((prev) => {
      if (prev.some((item) => item.toLowerCase() === tag.toLowerCase())) {
        return prev
      }
      return [...prev, tag]
    })
    setDraftTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      return
    }
    setIsSubmitting(true)
    try {
      await onConfirm(selectedTags)
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
            <Tag className="w-5 h-5 text-indigo-600" />
            <DialogTitle>Gán Thẻ Tag</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Chọn hoặc tạo thẻ để gán cho{' '}
            <strong className="font-mono text-slate-800 dark:text-slate-200">
              {contactCount.toLocaleString('vi-VN')}
            </strong>{' '}
            liên hệ đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Thẻ sẽ gán
            </div>
            <div className="min-h-[44px] flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              {selectedTags.length === 0 ? (
                <span className="text-xs text-slate-400">Chưa chọn thẻ nào</span>
              ) : (
                selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-rose-600 cursor-pointer"
                      aria-label={`Xóa thẻ ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Nhập thẻ mới rồi Enter..."
                value={draftTag}
                onChange={(e) => setDraftTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(draftTag)
                  }
                }}
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              disabled={!normalizeTag(draftTag)}
              onClick={() => addTag(draftTag)}
            >
              Thêm
            </Button>
          </div>

          {isLoadingCatalog ? (
            <div className="text-xs text-slate-400">Đang tải thẻ có sẵn...</div>
          ) : suggestionTags.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Thẻ có sẵn
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {suggestionTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer transition"
                  >
                    +#{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Chưa có thẻ catalog. Nhập tên thẻ mới hoặc tạo thẻ trong Quản Lý Thẻ.
            </div>
          )}
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
            disabled={selectedTags.length === 0}
            leftIcon={<Tag className="w-3.5 h-3.5" />}
            onClick={() => void handleConfirm()}
          >
            Gán Thẻ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AssignTagsDialog
