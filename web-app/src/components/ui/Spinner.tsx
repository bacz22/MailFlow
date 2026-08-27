import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'muted'
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  }[size]

  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    white: 'text-white',
    muted: 'text-slate-400',
  }[color]

  return (
    <div role="status" aria-label="Đang tải dữ liệu..." className={cn('inline-flex items-center justify-center', className)} {...props}>
      <Loader2 className={cn('animate-spin', sizeClasses, colorClasses)} />
      <span className="sr-only">Đang tải...</span>
    </div>
  )
}
