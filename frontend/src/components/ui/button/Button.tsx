import React from 'react'
import { Button as BaseButton, ButtonProps as BaseButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ButtonProps extends BaseButtonProps {
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

/**
 * Button Component - Wrapper cho compatibility
 */
export default function Button({ 
  size = 'default', 
  className,
  ...props 
}: ButtonProps) {
  return (
    <BaseButton
      size={size}
      className={className}
      {...props}
    />
  )
}




