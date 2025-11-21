'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

/**
 * Modal Component - Base modal component
 */
export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Modal dialog"
    >
      <div
        className={cn(
          'relative bg-background rounded-lg shadow-lg max-h-[90vh] overflow-hidden',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// Add Escape key closing behavior by default for better UX when modal backdrop
// covers the screen and user cannot click to close (or when content throws).
// We attach the handler at module-level so it's available whenever Modal is mounted.
export function useModalEscape(onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, enabled])
}




