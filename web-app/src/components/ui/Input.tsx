import React, { forwardRef, useState } from 'react'
import { Eye, EyeOff, Mail, Search, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  inputSize?: 'sm' | 'md' | 'lg'
  hasError?: boolean
  hasSuccess?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  prefixText?: string
  suffixText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      inputSize = 'md',
      hasError = false,
      hasSuccess = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      prefixText,
      suffixText,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 text-xs rounded-md',
      md: 'h-[38px] text-sm rounded-lg',
      lg: 'h-11 text-base rounded-lg',
    }[inputSize]

    const paddingClasses = cn(
      inputSize === 'sm' ? 'px-2.5' : inputSize === 'lg' ? 'px-4' : 'px-3.5',
      leftIcon && (inputSize === 'sm' ? 'pl-8' : inputSize === 'lg' ? 'pl-11' : 'pl-9.5'),
      (rightIcon || isLoading || hasError || hasSuccess) &&
        (inputSize === 'sm' ? 'pr-8' : inputSize === 'lg' ? 'pr-11' : 'pr-9.5'),
      prefixText && 'rounded-l-none pl-2.5',
      suffixText && 'rounded-r-none pr-2.5'
    )

    const stateClasses = cn(
      hasError
        ? 'border-red-500 text-red-950 dark:text-red-100 placeholder-red-300 has-error'
        : hasSuccess
        ? 'border-emerald-500 text-emerald-950 dark:text-emerald-100 placeholder-emerald-300 has-success'
        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
      disabled && 'opacity-60 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-500 dark:text-slate-400',
      readOnly && 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-default select-all'
    )

    const renderedRightIcon = () => {
      if (isLoading) {
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
      }
      if (hasError && !rightIcon) {
        return <AlertCircle className="w-4 h-4 text-red-500" />
      }
      if (hasSuccess && !rightIcon) {
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      }
      return rightIcon
    }

    const inputNode = (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 shrink-0">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            'input-control w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500',
            sizeClasses,
            paddingClasses,
            stateClasses,
            className
          )}
          {...props}
        />
        {(rightIcon || isLoading || hasError || hasSuccess) && (
          <div className="absolute right-3 flex items-center text-slate-400 dark:text-slate-500 shrink-0">
            {renderedRightIcon()}
          </div>
        )}
      </div>
    )

    if (!prefixText && !suffixText) {
      return inputNode
    }

    return (
      <div className="flex items-center w-full rounded-lg">
        {prefixText && (
          <span
            className={cn(
              'inline-flex items-center px-3 border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 select-none text-xs sm:text-sm font-medium rounded-l-lg',
              sizeClasses
            )}
          >
            {prefixText}
          </span>
        )}
        {inputNode}
        {suffixText && (
          <span
            className={cn(
              'inline-flex items-center px-3 border border-l-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 select-none text-xs sm:text-sm font-medium rounded-r-lg',
              sizeClasses
            )}
          >
            {suffixText}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <Input
        type={showPassword ? 'text' : 'password'}
        ref={ref}
        disabled={disabled}
        rightIcon={
          showToggle && !disabled ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded focus:outline-none"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export interface EmailInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>((props, ref) => {
  return (
    <Input
      type="email"
      ref={ref}
      placeholder="ten.nguoidung@congty.com"
      leftIcon={<Mail className="w-4 h-4" />}
      {...props}
    />
  )
})
EmailInput.displayName = 'EmailInput'

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon'> {
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, onChange, disabled, ...props }, ref) => {
    return (
      <Input
        type="search"
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={onChange}
        leftIcon={<Search className="w-4 h-4" />}
        rightIcon={
          value && onClear && !disabled ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={onClear}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus:outline-none"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
SearchInput.displayName = 'SearchInput'
