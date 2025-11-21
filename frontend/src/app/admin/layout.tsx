'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { sidebarMenuConfig, MenuItem } from '@/config/dashboard.config'
import { filterMenuByRole, canAccessAdminDashboard, UserRole } from '@/config/role-permissions.config'

/**
 * Admin Layout - Layout chung cho tất cả admin pages
 * 
 * - KHÔNG đổi UI
 * - Cho phép: Admin, Staff, Technician
 * - Nếu chưa đăng nhập: chuyển /signin
 * - Nếu không đủ quyền: chuyển /user/service
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userName, setUserName] = useState('Admin User')
  const [userAvatar, setUserAvatar] = useState<string | undefined>()
  const [userRole, setUserRole] = useState<UserRole>('Admin')
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null) // null = checking, true = authorized, false = unauthorized

  /**
   * Check authentication and role
   */
  useEffect(() => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
        : null
      const userStr = typeof window !== 'undefined'
        ? (localStorage.getItem('user') || sessionStorage.getItem('user'))
        : null

      if (!token || !userStr) {
        // ⬇️ QUAN TRỌNG: set trạng thái trước khi chuyển trang để không "đứng hình"
        setIsAuthorized(false)
        router.push('/signin')
        return
      }

      const user = JSON.parse(userStr)
      const role = (user.Role as UserRole) || 'Customer'

      // Cho phép Admin/Staff/Technician
      if (!canAccessAdminDashboard(role)) {
        setIsAuthorized(false)
        router.push('/user/service')
        return
      }

      // OK
      setIsAuthorized(true)
      setUserName(user.FullName || user.Username || 'Admin User')
      setUserAvatar(user.avatar)
      setUserRole(role)
    } catch (error) {
      console.error('Error parsing user data:', error)
      setIsAuthorized(false)
      router.push('/signin')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]) // không cần thêm dependencies khác để tránh re-run thừa

  /**
   * Load menu config - filter theo role
   */
  useEffect(() => {
    if (isAuthorized) {
      try {
        const filtered = filterMenuByRole(sidebarMenuConfig, userRole)
        setMenuItems(filtered)
      } catch (error) {
        console.error('Error loading menu config:', error)
        setMenuItems([])
      }
    }
  }, [isAuthorized, userRole])

  /**
   * Handle search / notifications (giữ nguyên)
   */
  const handleSearch = (query: string) => {
    console.log('Search query:', query)
  }
  const handleNotificationClick = () => {
    console.log('Notification clicked')
  }

  // Loading while checking
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Redirected → không render gì
  if (!isAuthorized) {
    return null
  }

  // ⬇️ UI/JSX GIỮ NGUYÊN
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
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
        {/* Header */}
        <Header
          userName={userName}
          userAvatar={userAvatar}
          userRole={userRole}
          sidebarCollapsed={sidebarCollapsed}
          onSearch={handleSearch}
          onNotificationClick={handleNotificationClick}
        />

        {/* Page content */}
        <main className="pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
