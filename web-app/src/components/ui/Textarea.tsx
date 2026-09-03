import React, { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
  hasSuccess?: boolean
  maxLength?: number
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, hasSuccess = false, maxLength, showCount = false, value, disabled, readOnly, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full relative">
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            'input-control w-full min-h-[80px] p-3 text-sm rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y',
            hasError
              ? 'border-red-500 has-error'
              : hasSuccess
              ? 'border-emerald-500 has-success'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
            disabled && 'opacity-60 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-500 dark:text-slate-400',
            readOnly && 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-default select-all',
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <div className="text-right text-[11px] text-slate-400 mt-1 font-mono">
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
