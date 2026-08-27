import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  isLoading?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy kết quả',
  disabled = false,
  isLoading = false,
  hasError = false,
  hasSuccess = false,
  size = 'md',
  className,
}) => {
  const [internalVal, setInternalVal] = useState(defaultValue || '')
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const activeValue = value !== undefined ? value : internalVal

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === activeValue)

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-[38px] px-3.5 text-sm rounded-lg',
    lg: 'h-11 px-4 text-base rounded-lg',
  }[size]

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        className={cn(
          'input-control flex w-full items-center justify-between bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 select-none cursor-pointer',
          hasError
            ? 'border-red-500 has-error'
            : hasSuccess
            ? 'border-emerald-500 has-success'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
          (disabled || isLoading) && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400',
          sizeClasses
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-slate-400 dark:text-slate-500 font-normal')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          )}
        </div>
      </button>

      {isOpen && !disabled && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
            <Search className="w-3.5 h-3.5 absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-control w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">{emptyText}</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === activeValue
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setInternalVal(opt.value)
                      onChange(opt.value)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors select-none',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    )}
                  >
                    <div>
                      <div>{opt.label}</div>
                      {opt.description && (
                        <div className="text-[11px] text-slate-400 font-normal">{opt.description}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
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
