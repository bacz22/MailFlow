import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface MultiSelectOption {
  value: string
  label: string
  badgeColor?: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  isLoading?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  maxVisibleChips?: number
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Chọn các mục...',
  searchPlaceholder = 'Tìm kiếm lựa chọn...',
  disabled = false,
  isLoading = false,
  hasError = false,
  hasSuccess = false,
  size = 'md',
  className,
  maxVisibleChips = 3,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val))
    } else {
      onChange([...selected, val])
    }
  }

  const handleRemoveChip = (e: React.MouseEvent, val: string) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== val))
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedOptions = options.filter((opt) => selected.includes(opt.value))
  const visibleOptions = selectedOptions.slice(0, maxVisibleChips)
  const extraCount = selectedOptions.length - maxVisibleChips

  const sizeClasses = {
    sm: 'min-h-[32px] text-xs py-0.5 px-2 rounded-md',
    md: 'min-h-[38px] text-sm py-1 px-3 rounded-lg',
    lg: 'min-h-[44px] text-base py-1.5 px-3.5 rounded-lg',
  }[size]

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        role="button"
        tabIndex={disabled || isLoading ? -1 : 0}
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isLoading) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className={cn(
          'input-control w-full flex items-center justify-between gap-1.5 border bg-white dark:bg-slate-900 cursor-pointer select-none',
          hasError
            ? 'border-red-500 has-error'
            : hasSuccess
            ? 'border-emerald-500 has-success'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
          (disabled || isLoading) && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400',
          sizeClasses
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-500 py-0.5">{placeholder}</span>
          ) : (
            <>
              {visibleOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-xs font-medium"
                >
                  <span className="truncate max-w-[120px]">{opt.label}</span>
                  {!disabled && !isLoading && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => handleRemoveChip(e, opt.value)}
                      className="hover:text-blue-900 dark:hover:text-white rounded focus:outline-none"
                      aria-label={`Xóa ${opt.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono font-semibold">
                  +{extraCount}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400 pr-0.5">
          {selectedOptions.length > 0 && !disabled && !isLoading && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClearAll}
              className="p-0.5 hover:text-slate-600 dark:hover:text-slate-200 rounded focus:outline-none"
              title="Xóa tất cả"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          )}
        </div>
      </div>

      {isOpen && !disabled && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-control w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Không tìm thấy kết quả</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    className={cn(
                      'flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-xs transition-colors select-none',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
