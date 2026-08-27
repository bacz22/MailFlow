import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string
  description?: string
  indeterminate?: boolean
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, indeterminate, id, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id || (label ? `cb-${generatedId}` : undefined)

  const checkboxNode = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white transition duration-150 cursor-pointer flex items-center justify-center',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
        {indeterminate ? <Minus className="h-3 w-3" /> : <Check className="h-3 w-3 stroke-[3]" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (!label && !description) {
    return checkboxNode
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="pt-0.5">{checkboxNode}</div>
      <div className="grid gap-0.5 leading-none">
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 select-none">{description}</p>
        )}
      </div>
    </div>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName
