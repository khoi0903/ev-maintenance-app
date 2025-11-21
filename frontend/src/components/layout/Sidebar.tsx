'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MenuItem } from '@/config/dashboard.config'

/**
 * Icon component - có thể thay bằng lucide-react hoặc icon library khác
 */
const Icon = ({ name, className }: { name: string; className?: string }) => {
  // Map icon name to SVG hoặc icon component
  const iconMap: Record<string, string> = {
    dashboard: '📊',
    users: '👥',
    services: '🔧',
    car: '🚗',
    calendar: '📅',
    task: '📋',
    shield: '🛡️',
    box: '📦',
    chart: '📈',
    'chart-line': '📉',
    dollar: '💰',
  }
  
  return (
    <span className={cn('text-lg', className)}>
      {iconMap[name] || '📄'}
    </span>
  )
}

interface SidebarProps {
  menuItems: MenuItem[]
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

/**
 * Sidebar Component - Module hóa, tự động render menu từ config
 * 
 * @param menuItems - Danh sách menu items từ config
 * @param isCollapsed - Trạng thái thu gọn sidebar
 * @param onToggleCollapse - Callback để toggle collapse
 */
export default function Sidebar({ 
  menuItems, 
  isCollapsed = false,
  onToggleCollapse 
}: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  /**
   * Toggle submenu expand/collapse
   */
  const toggleSubmenu = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  /**
   * Render menu item
   */
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = pathname === item.href
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id}>
        <Link
          href={item.href}
          onClick={() => {
            if (hasChildren) {
              toggleSubmenu(item.id)
            }
          }}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isActive && 'bg-primary text-primary-foreground',
            level > 0 && 'ml-6',
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
              {hasChildren && (
                <span className={cn(
                  'transition-transform',
                  isExpanded && 'rotate-90'
                )}>
                  ▶
                </span>
              )}
            </>
          )}
        </Link>

        {/* Render submenu items */}
        {hasChildren && !isCollapsed && isExpanded && (
          <div className="mt-1">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

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
          <span className="text-2xl font-bold">E</span>
        ) : (
          <span className="text-xl font-bold">EV Maintenance</span>
        )}
      </div>

      {/* Toggle button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-4 -right-3 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs hover:bg-primary/90 z-50"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      )}

      {/* Menu items */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </aside>
  )
}



