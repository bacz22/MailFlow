import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-ring',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm border border-transparent',
        secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700',
        outline: 'border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
        ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 text-slate-700 dark:text-slate-300',
        danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm border border-transparent',
        link: 'text-blue-600 dark:text-blue-400 hover:underline underline-offset-4 p-0 h-auto font-normal bg-transparent',
      },
      size: {
        sm: 'h-8 px-2.5 rounded-md text-xs gap-1.5',
        md: 'h-[38px] px-3.5 rounded-lg text-sm gap-2',
        lg: 'h-11 px-5 rounded-lg text-base gap-2.5',
        icon: 'h-[38px] w-[38px] rounded-lg p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)
Button.displayName = 'Button'

export interface IconButtonProps extends ButtonProps {
  'aria-label': string
  icon: React.ReactNode
  tooltip?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', iconSize = 'md', icon, 'aria-label': ariaLabel, ...props }, ref) => {
    const sizeClass = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-[38px] w-[38px] text-sm',
      lg: 'h-11 w-11 text-base',
    }[iconSize]

    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        aria-label={ariaLabel}
        className={cn(sizeClass, className)}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = 'IconButton'
