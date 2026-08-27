import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import { cn } from '../../utils/cn'

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2.5', className)} {...props} ref={ref} />
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label?: string
  description?: string
}

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId()
  const itemId = id || (label ? `rg-${generatedId}` : undefined)

  const itemNode = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={itemId}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-blue-600 transition duration-150 cursor-pointer flex items-center justify-center',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )

  if (!label && !description) {
    return itemNode
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="pt-0.5">{itemNode}</div>
      <div className="grid gap-0.5 leading-none">
        {label && (
          <label
            htmlFor={itemId}
            className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer select-none"
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
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName
