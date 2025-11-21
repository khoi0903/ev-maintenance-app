import React from 'react'
import { cn } from '@/lib/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

/**
 * Label Component - Form label
 */
export default function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-foreground mb-2',
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}




