import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

export const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full border px-2.5 py-0.5 text-xs transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-600 text-white',
        secondary: 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
        outline: 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        danger: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',
        info: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400',
        neutral: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400',
      },
      size: {
        sm: 'text-[10px] px-1.5 py-0.2',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ className, variant, size, icon, children, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1 shrink-0">{icon}</span>}
      {children}
    </div>
  )
}
