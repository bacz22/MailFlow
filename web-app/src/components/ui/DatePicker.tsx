import React, { useState, useRef, useEffect } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check
} from 'lucide-react'
import { cn } from '../../utils/cn'

// Helpers
const MONTHS_VN = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

const DAYS_HEADER_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function formatDateToVN(isoDateStr?: string): string {
  if (!isoDateStr) return ''
  const parts = isoDateStr.split('-')
  if (parts.length !== 3) return isoDateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function parseISODate(isoStr?: string): Date | null {
  if (!isoStr) return null
  const [y, m, d] = isoStr.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toISODateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ----------------------------------------------------
// 1. CUSTOM DATEPICKER COMPONENT
// ----------------------------------------------------
export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  defaultValue?: string
  onChange?: (date: string) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
  disabled?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  defaultValue,
  onChange,
  placeholder = 'Chọn ngày...',
  minDate,
  maxDate,
  disabled = false,
  hasError = false,
  hasSuccess = false,
  size = 'md',
  className,
}) => {
  const [internalVal, setInternalVal] = useState(defaultValue || '')
  const [isOpen, setIsOpen] = useState(false)

  const selectedDateStr = value !== undefined ? value : internalVal
  const selectedDateObj = parseISODate(selectedDateStr)

  // Current calendar view (month & year)
  const initialYear = selectedDateObj ? selectedDateObj.getFullYear() : new Date().getFullYear()
  const initialMonth = selectedDateObj ? selectedDateObj.getMonth() : new Date().getMonth()
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  const handleSelectDate = (d: Date) => {
    const iso = toISODateString(d)
    setInternalVal(iso)
    onChange?.(iso)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalVal('')
    onChange?.('')
  }

  const handleSetToday = () => {
    const today = new Date()
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    handleSelectDate(today)
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6 // Sunday index 6

  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const calendarDays: {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
  }[] = []

  // Prev month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i)
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDateObj ? toISODateString(d) === selectedDateStr : false,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  // Current month days
  const todayStr = toISODateString(new Date())
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear, viewMonth, day)
    const iso = toISODateString(d)
    calendarDays.push({
      date: d,
      isCurrentMonth: true,
      isToday: iso === todayStr,
      isSelected: iso === selectedDateStr,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  // Next month padding to fill 35 or 42 cells
  const remainingCells = (7 - (calendarDays.length % 7)) % 7
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(viewYear, viewMonth + 1, day)
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDateObj ? toISODateString(d) === selectedDateStr : false,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-[38px] px-3.5 text-sm rounded-lg',
    lg: 'h-11 px-4 text-base rounded-lg',
  }[size]

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          className={cn(
            'input-control w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 select-none cursor-pointer',
            hasError
              ? 'border-red-500 has-error'
              : hasSuccess
              ? 'border-emerald-500 has-success'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400',
            sizeClasses,
            className
          )}
        >
          <span className={cn('truncate font-medium', !selectedDateStr && 'text-slate-400 dark:text-slate-500 font-normal')}>
            {selectedDateStr ? formatDateToVN(selectedDateStr) : placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500">
            {selectedDateStr && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
                title="Xóa ngày đã chọn"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-72 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        >
          {/* Header Month / Year controls */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="font-bold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-slate-200">
              {MONTHS_VN[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_HEADER_VN.map((dayName, idx) => (
              <div
                key={dayName}
                className={cn(
                  'text-[11px] font-semibold py-1 select-none',
                  idx >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              const dayNum = item.date.getDate()
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => !item.isDisabled && handleSelectDate(item.date)}
                  className={cn(
                    'h-8 w-8 mx-auto flex items-center justify-center text-xs rounded-lg transition-all relative select-none font-medium cursor-pointer',
                    item.isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 scale-105 z-10'
                      : item.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400'
                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40',
                    item.isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent text-slate-300',
                    item.isToday && !item.isSelected && 'font-bold text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  )}
                >
                  <span>{dayNum}</span>
                  {item.isToday && !item.isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer Quick Action Buttons */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Hôm nay
            </button>
            {selectedDateStr && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-500 font-medium cursor-pointer"
              >
                Xóa chọn
              </button>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function isDateDisabled(d: Date, min?: string, max?: string): boolean {
  const iso = toISODateString(d)
  if (min && iso < min) return true
  if (max && iso > max) return true
  return false
}

// ----------------------------------------------------
// 2. CUSTOM TIMEPICKER COMPONENT (00-23h & 00-59m with auto-scroll)
// ----------------------------------------------------
export interface TimePickerProps {
  value?: string // HH:mm (24h)
  defaultValue?: string
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const QUICK_TIME_PRESETS = [
  { label: '08:00 (Sáng sớm)', time: '08:00' },
  { label: '09:30 (Khung giờ vàng)', time: '09:30' },
  { label: '14:00 (Đầu giờ chiều)', time: '14:00' },
  { label: '18:00 (Tan sở)', time: '18:00' },
  { label: '20:30 (Buổi tối)', time: '20:30' },
]

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  defaultValue,
  onChange,
  placeholder = 'Chọn giờ...',
  disabled = false,
  hasError = false,
  hasSuccess = false,
  size = 'md',
  className,
}) => {
  const [internalVal, setInternalVal] = useState(defaultValue || '')
  const [isOpen, setIsOpen] = useState(false)

  const hoursContainerRef = useRef<HTMLDivElement>(null)
  const minutesContainerRef = useRef<HTMLDivElement>(null)

  const selectedTime = value !== undefined ? value : internalVal
  const [selectedHour, selectedMinute] = selectedTime.includes(':')
    ? selectedTime.split(':')
    : ['09', '30']

  // Auto scroll to active hour & minute when opening popover
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const selHourEl = hoursContainerRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
        if (selHourEl && hoursContainerRef.current) {
          hoursContainerRef.current.scrollTop = selHourEl.offsetTop - hoursContainerRef.current.offsetTop - 40
        }

        const selMinEl = minutesContainerRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
        if (selMinEl && minutesContainerRef.current) {
          minutesContainerRef.current.scrollTop = selMinEl.offsetTop - minutesContainerRef.current.offsetTop - 40
        }
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [isOpen, selectedHour, selectedMinute])

  const handleSelectTime = (h: string, m: string) => {
    const t = `${h}:${m}`
    setInternalVal(t)
    onChange?.(t)
  }

  const handleSelectPreset = (t: string) => {
    setInternalVal(t)
    onChange?.(t)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalVal('')
    onChange?.('')
  }

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-[38px] px-3.5 text-sm rounded-lg',
    lg: 'h-11 px-4 text-base rounded-lg',
  }[size]

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          className={cn(
            'input-control w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 select-none cursor-pointer',
            hasError
              ? 'border-red-500 has-error'
              : hasSuccess
              ? 'border-emerald-500 has-success'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400',
            sizeClasses,
            className
          )}
        >
          <span className={cn('truncate font-medium font-mono', !selectedTime && 'text-slate-400 dark:text-slate-500 font-sans font-normal')}>
            {selectedTime ? selectedTime : placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500">
            {selectedTime && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
                title="Xóa giờ đã chọn"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-72 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">
              Chọn Thời Gian (24H)
            </div>
            <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
              {selectedHour}:{selectedMinute}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 bg-slate-50/70 dark:bg-slate-950/60">
            {/* Hours Column (00 - 23) */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center pb-1.5 mb-1 border-b border-slate-200 dark:border-slate-800">
                Giờ (00 - 23)
              </div>
              <div
                ref={hoursContainerRef}
                className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
              >
                {HOURS_LIST.map((h) => {
                  const isSel = h === selectedHour
                  return (
                    <button
                      key={h}
                      type="button"
                      data-selected={isSel ? 'true' : undefined}
                      onClick={() => handleSelectTime(h, selectedMinute)}
                      className={cn(
                        'w-full py-1.5 text-center rounded-lg text-xs font-mono transition-all select-none cursor-pointer',
                        isSel
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 scale-[1.02]'
                          : 'hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                      )}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Minutes Column (00 - 59 Full List) */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center pb-1.5 mb-1 border-b border-slate-200 dark:border-slate-800">
                Phút (00 - 59)
              </div>
              <div
                ref={minutesContainerRef}
                className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
              >
                {MINUTES_LIST.map((m) => {
                  const isSel = m === selectedMinute
                  return (
                    <button
                      key={m}
                      type="button"
                      data-selected={isSel ? 'true' : undefined}
                      onClick={() => handleSelectTime(selectedHour, m)}
                      className={cn(
                        'w-full py-1.5 text-center rounded-lg text-xs font-mono transition-all select-none cursor-pointer',
                        isSel
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 scale-[1.02]'
                          : 'hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                      )}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Gợi Ý Nhanh
            </div>
            <div className="grid grid-cols-2 gap-1">
              {QUICK_TIME_PRESETS.map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => handleSelectPreset(preset.time)}
                  className={cn(
                    'text-left px-2 py-1 rounded-md text-[11px] flex items-center justify-between transition-colors cursor-pointer',
                    selectedTime === preset.time
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  )}
                >
                  <span className="truncate">{preset.label.split(' ')[0]}</span>
                  {selectedTime === preset.time && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

// ----------------------------------------------------
// 3. COMBINED DATETIMEPICKER COMPONENT
// ----------------------------------------------------
export interface DateTimePickerProps {
  dateValue?: string
  timeValue?: string
  onDateChange?: (date: string) => void
  onTimeChange?: (time: string) => void
  disabled?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled,
  hasError,
  hasSuccess,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div className="flex-1">
        <DatePicker
          value={dateValue}
          onChange={onDateChange}
          disabled={disabled}
          hasError={hasError}
          hasSuccess={hasSuccess}
          size={size}
        />
      </div>
      <div className="w-32 sm:w-40">
        <TimePicker
          value={timeValue}
          onChange={onTimeChange}
          disabled={disabled}
          hasError={hasError}
          hasSuccess={hasSuccess}
          size={size}
        />
      </div>
    </div>
  )
}
