'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MenuItem } from '@/config/dashboard.config'

/**
 * Icon component cho User Sidebar
 */
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const iconMap: Record<string, string> = {
    dashboard: '📊',
    services: '🔧',
    car: '🚗',
    calendar: '📅',
    task: '📋',
    users: '👤',
  }
  
  return (
    <span className={cn('text-lg', className)}>
      {iconMap[name] || '📄'}
    </span>
  )
}

interface UserSidebarProps {
  menuItems: MenuItem[]
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

/**
 * User Sidebar Component - Sidebar riêng cho user dashboard
 * 
 * Tách biệt hoàn toàn với admin sidebar
 */
export default function UserSidebar({ 
  menuItems, 
  isCollapsed = false,
  onToggleCollapse 
}: UserSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-card border-r transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo/Brand */}
      <div className={cn(
        'h-16 border-b flex items-center px-4',
        isCollapsed && 'justify-center'
      )}>
        {isCollapsed ? (
          <span className="text-2xl font-bold text-green-600">E</span>
        ) : (
          <span className="text-xl font-bold text-green-600">EV Maintenance</span>
        )}
      </div>

      {/* Toggle button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-4 -right-3 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-green-700 z-50"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      )}

      {/* Menu items */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                'hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400',
                isActive && 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium',
                isCollapsed && 'justify-center px-2'
              )}
            >
              {item.icon && (
                <Icon 
                  name={item.icon} 
                  className={cn(
                    'shrink-0',
                    isCollapsed && 'mx-auto'
                  )} 
                />
              )}
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

