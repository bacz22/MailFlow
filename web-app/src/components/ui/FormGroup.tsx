import React from 'react'
import { AlertCircle, HelpCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Tooltip } from './Tooltip'

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('space-y-1.5 w-full', className)} {...props}>
      {children}
    </div>
  )
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  tooltip?: string
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  required,
  tooltip,
  className,
  ...props
}) => {
  return (
    <div className="flex items-center gap-1 mb-1">
      <label
        className={cn('text-xs font-semibold text-slate-700 dark:text-slate-300 select-none', className)}
        {...props}
      >
        {children}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {tooltip && (
        <Tooltip content={tooltip}>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-ring rounded"
            aria-label="Hướng dẫn trường này"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const FormDescription: React.FC<FormDescriptionProps> = ({ className, children, ...props }) => {
  if (!children) return null
  return (
    <p className={cn('text-[11px] text-slate-500 dark:text-slate-400 leading-normal', className)} {...props}>
      {children}
    </p>
  )
}

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: string | boolean | null
}

export const FormMessage: React.FC<FormMessageProps> = ({ className, error, children, ...props }) => {
  const message = typeof error === 'string' ? error : children
  if (!message) return null

  return (
    <p
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 animate-in fade-in-0 duration-150',
        className
      )}
      role="alert"
      {...props}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  )
}

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  columns?: 1 | 2
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  columns = 1,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('space-y-4 pt-4 first:pt-0', className)} {...props}>
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className={cn('grid gap-4', columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
        {children}
      </div>
    </div>
  )
}
