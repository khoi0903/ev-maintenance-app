'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dropdown } from '@/components/ui/dropdown/Dropdown'
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  senderName: string
  senderAvatar?: string
  message: string
  timeAgo: string
  unread?: boolean
}

interface HeaderUserActionsProps {
  userName?: string
  userAvatar?: string
  userRole?: string
  notifications?: Notification[]
  onSignOut?: () => void
}

/**
 * HeaderUserActions Component - Notification Bell và User Profile với Dropdowns
 * 
 * @param userName - Tên người dùng
 * @param userAvatar - URL avatar người dùng
 * @param notifications - Danh sách thông báo
 * @param onSignOut - Callback khi sign out
 */
export default function HeaderUserActions({
  userName = 'Admin User',
  userAvatar,
  userRole,
  notifications = [],
  onSignOut,
}: HeaderUserActionsProps) {
  const router = useRouter()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Map role to display text
  const getRoleDisplay = (role?: string): string => {
    if (!role) return 'Administrator'
    const roleMap: Record<string, string> = {
      'Admin': 'Quản trị viên',
      'Staff': 'Nhân viên',
      'Technician': 'Kỹ thuật viên',
      'Customer': 'Khách hàng',
    }
    return roleMap[role] || role
  }

  const roleDisplay = getRoleDisplay(userRole)

  // Use notifications from props, no mock data
  const displayNotifications: Notification[] = notifications || []
  const unreadCount = displayNotifications.filter((n) => n.unread).length

  /**
   * Get user initials for avatar fallback
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Handle sign out - Clear storage and redirect to signin
   */
  const handleSignOut = () => {
    setUserMenuOpen(false)
    
    // Clear authentication data from localStorage and sessionStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    
    // Call custom onSignOut callback if provided
    onSignOut?.()
    
    // Redirect to signin page
    router.push('/signin')
  }

  return (
    <div className="flex items-center gap-4">
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => {
            setNotificationOpen(!notificationOpen)
            setUserMenuOpen(false)
          }}
          className={cn(
            'relative w-10 h-10 rounded-full flex items-center justify-center',
            'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
            'transition-colors',
            notificationOpen && 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        <Dropdown
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
          className="w-80 max-w-sm mt-2"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notification
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có thông báo nào
                </p>
              ) : (
                displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    notification.unread && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage 
                      src={notification.senderAvatar} 
                      alt={notification.senderName}
                    />
                    <AvatarFallback>
                      {getInitials(notification.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.senderName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {notification.timeAgo}
                    </p>
                  </div>
                </div>
              ))
              )}
            </div>

            {/* View All Button */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setNotificationOpen(false)
                  router.push('/admin/notifications')
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </Dropdown>
      </div>

      {/* User Profile */}
      <div className="relative">
        <button
          onClick={() => {
            setUserMenuOpen(!userMenuOpen)
            setNotificationOpen(false)
          }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {roleDisplay}
            </p>
          </div>
          <Avatar className="w-10 h-10">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </button>

        {/* User Menu Dropdown */}
        <Dropdown
          isOpen={userMenuOpen}
          onClose={() => setUserMenuOpen(false)}
          className="w-56 mt-2"
        >
          <div className="p-2">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {roleDisplay}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <DropdownItem
                tag="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  router.push('/admin/profile')
                }}
                baseClassName="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-lg">✏️</span>
                <span>Edit profile</span>
              </DropdownItem>

              <DropdownItem
                tag="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  router.push('/admin/settings')
                }}
                baseClassName="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-lg">⚙️</span>
                <span>Account settings</span>
              </DropdownItem>

              <DropdownItem
                tag="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  router.push('/admin/support')
                }}
                baseClassName="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-lg">💬</span>
                <span>Support</span>
              </DropdownItem>

              {/* Divider */}
              <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

              <DropdownItem
                tag="button"
                onClick={handleSignOut}
                baseClassName="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-lg">🚪</span>
                <span>Sign out</span>
              </DropdownItem>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  )
}

