'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import HeaderUserActions from '@/components/layout/HeaderUserActions'
import { cn } from '@/lib/utils'

interface HeaderProps {
  userName?: string
  userAvatar?: string
  userRole?: string
  sidebarCollapsed?: boolean
  onSearch?: (query: string) => void
  onNotificationClick?: () => void
}

/**
 * Header Component - Module hóa với user info, search, notifications
 * 
 * @param userName - Tên người dùng
 * @param userAvatar - URL avatar người dùng
 * @param sidebarCollapsed - Trạng thái sidebar để điều chỉnh margin
 * @param onSearch - Callback khi search
 * @param onNotificationClick - Callback khi click notification
 */
export default function Header({
  userName = 'Admin User',
  userAvatar,
  userRole,
  sidebarCollapsed = false,
  onSearch,
  onNotificationClick,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-card border-b z-30 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              🔍
            </span>
          </div>
        </div>

        {/* Right side: Notifications and User */}
        <HeaderUserActions
          userName={userName}
          userAvatar={userAvatar}
          userRole={userRole}
          onSignOut={() => {
            // Handle sign out logic here
            console.log('Sign out clicked')
          }}
        />
      </div>
    </header>
  )
}



