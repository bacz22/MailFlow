import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface SelectOption {
  value: string
  label: React.ReactNode
  textValue?: string
  disabled?: boolean
}

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options?: SelectOption[]
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'md' | 'lg'
    hasError?: boolean
    hasSuccess?: boolean
    isLoading?: boolean
  }
>(({ className, children, size = 'md', hasError = false, hasSuccess = false, isLoading = false, disabled, ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-[38px] px-3.5 text-sm rounded-lg',
    lg: 'h-11 px-4 text-base rounded-lg',
  }[size]

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'input-control flex w-full items-center justify-between bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 select-none cursor-pointer data-[state=open]:border-blue-600 dark:data-[state=open]:border-blue-500 data-[state=open]:ring-3 data-[state=open]:ring-blue-500/15',
        hasError
          ? 'border-red-500 has-error'
          : hasSuccess
          ? 'border-emerald-500 has-success'
          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
        disabled && 'cursor-not-allowed opacity-60 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400',
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
      <div className="flex items-center gap-1.5 ml-2 shrink-0">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        ) : (
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        )}
      </div>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1 max-h-80 overflow-y-auto',
          position === 'popper' &&
            'w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-xs sm:text-sm outline-none focus:bg-blue-50 dark:focus:bg-blue-950/60 focus:text-blue-600 dark:focus:text-blue-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export interface SimpleSelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (val: string) => void
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
  hasError?: boolean
  hasSuccess?: boolean
  className?: string
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Chọn một mục...',
  options,
  disabled,
  isLoading,
  size = 'md',
  hasError,
  hasSuccess,
  className,
}) => {
  const [open, setOpen] = React.useState(false)
  const isDisabled = disabled || isLoading

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={isDisabled}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger
        size={size}
        hasError={hasError}
        hasSuccess={hasSuccess}
        isLoading={isLoading}
        className={className}
        // Radix opens on pointerdown; defer to click so hover/press không bung menu.
        onPointerDown={(e) => {
          e.preventDefault()
          e.currentTarget.focus()
        }}
        onClick={() => {
          if (!isDisabled) setOpen((prev) => !prev)
        }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            textValue={opt.textValue || (typeof opt.label === 'string' ? opt.label : undefined)}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
