'use client'

import { useState, useCallback } from 'react'

/**
 * Custom hook để quản lý modal state
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    openModal,
    closeModal,
  }
}




