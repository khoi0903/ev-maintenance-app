import React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * InputField Component - Form input field
 */
export default function InputField({ className, ...props }: InputFieldProps) {
  return <Input className={cn('', className)} {...props} />
}




