'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserSidebar from '@/components/user-layout/UserSidebar'
import UserHeader from '@/components/user-layout/UserHeader'

// ⬇️ tách import: type lấy từ dashboard.config, data lấy từ user-menu.config
import type { MenuItem } from '@/config/dashboard.config'
import { userMenuConfig } from '@/config/user-menu.config'

/**
 * User Layout - Layout chung cho tất cả user pages
 * 
 * Layout này bao gồm:
 * - Sidebar với menu cho khách hàng
 * - Header với user info
 * - Main content area
 * - Authentication check: Redirect to signin if not logged in
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userName, setUserName] = useState('Customer User')
  const [userAvatar, setUserAvatar] = useState<string | undefined>()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null) // null = checking, true = authorized, false = unauthorized

  /**
   * Check authentication
   */
  useEffect(() => {
    const checkAuth = () => {
      // Get token and user from storage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')

      if (!token || !userStr) {
        // Not logged in, redirect to signin
        setIsAuthorized(false)
        router.push('/signin')
        return
      }

      try {
        const user = JSON.parse(userStr)
        setIsAuthorized(true)
        
        // Set user info
        setUserName(user.FullName || user.fullName || user.Username || user.username || 'Customer User')
        setUserAvatar(user.avatar)
      } catch (error) {
        console.error('Error parsing user data:', error)
        setIsAuthorized(false)
        router.push('/signin')
      }
    }

    checkAuth()
  }, [router])

  /**
   * Load menu config
   */
  useEffect(() => {
    if (isAuthorized) {
      try {
        setMenuItems(userMenuConfig)
      } catch (error) {
        console.error('Error loading menu config:', error)
        setMenuItems([])
      }
    }
  }, [isAuthorized])

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Only render if authorized (isAuthorized === true)
  if (!isAuthorized) {
    return null // Will redirect, so don't render anything
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* User Sidebar - Riêng biệt với admin */}
      <UserSidebar
        menuItems={menuItems}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* User Header - Riêng biệt với admin */}
        <UserHeader
          userName={userName}
          userAvatar={userAvatar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page content */}
        <main className="p-6 pt-24">
          {children}
        </main>
      </div>
    </div>
  )
}

