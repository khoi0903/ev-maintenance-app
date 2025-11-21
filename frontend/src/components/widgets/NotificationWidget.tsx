'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read?: boolean
}

interface NotificationWidgetProps {
  config?: {
    maxItems?: number
    autoRefresh?: boolean
  }
  data?: any[] // Real data from API
  className?: string
}

/**
 * Notification Widget - Hiển thị danh sách thông báo
 * Transforms real notification API data into display format
 * 
 * @param config - Config cho widget (maxItems, autoRefresh)
 * @param data - Data từ API hoặc props
 * @param className - Additional CSS classes
 */
export default function NotificationWidget({ 
  config = {}, 
  data = [],
  className 
}: NotificationWidgetProps) {
  const { maxItems = 5 } = config

  // Transform API data (notifications) into display format
  const transformedNotifications: Notification[] = (Array.isArray(data) ? data : [])
    .map((item: any) => {
      const timeAgo = item.CreatedDate || item.CreatedAt ? 
        formatTimeAgo(new Date(item.CreatedDate || item.CreatedAt)) : 
        'just now'
      
      // Map notification type based on NotificationType field
      let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info'
      if (item.NotificationType) {
        const type = item.NotificationType.toLowerCase()
        if (type.includes('success') || type.includes('completed')) notificationType = 'success'
        else if (type.includes('warning') || type.includes('alert')) notificationType = 'warning'
        else if (type.includes('error') || type.includes('fail')) notificationType = 'error'
      }

      return {
        id: item.NotificationID?.toString() || item.id || Math.random().toString(),
        title: item.Title || item.NotificationType || 'Notification',
        message: item.Message || item.Description || 'No details',
        type: notificationType,
        timestamp: timeAgo,
        read: item.IsRead || item.read || false,
      }
    })

  // Default data nếu không có data từ props
  const defaultData: Notification[] = [
    {
      id: '1',
      title: 'New User Registration',
      message: 'A new user has registered in the system',
      type: 'info',
      timestamp: '2 minutes ago',
      read: false,
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'Payment of $500 has been received',
      type: 'success',
      timestamp: '15 minutes ago',
      read: false,
    },
    {
      id: '3',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight at 2 AM',
      type: 'warning',
      timestamp: '1 hour ago',
      read: true,
    },
    {
      id: '4',
      title: 'Order Completed',
      message: 'Order #12345 has been completed',
      type: 'success',
      timestamp: '2 hours ago',
      read: true,
    },
    {
      id: '5',
      title: 'Error Alert',
      message: 'Connection timeout detected in API service',
      type: 'error',
      timestamp: '3 hours ago',
      read: false,
    },
  ]

  // Helper to format time ago
  function formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  // Đảm bảo data không null và là array
  const notifications = transformedNotifications.length > 0 
    ? transformedNotifications 
    : []

  // Kiểm tra notifications có data không
  if (!notifications || notifications.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Thông báo hệ thống</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No notifications</p>
        </CardContent>
      </Card>
    )
  }

  /**
   * Get notification icon based on type
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  /**
   * Get notification color based on type
   */
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Thông báo hệ thống</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            Mark all read
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.slice(0, maxItems).map((notification) => (
            <button
              key={notification.id}
              onClick={() => {
                // If notification contains a link, open it; otherwise go to notifications page
                const notifUrl = (notification as any).link || `/admin/notifications/${notification.id}`
                try {
                  window.location.href = notifUrl
                } catch (err) {
                  console.log('navigate to notification', notifUrl)
                }
              }}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent',
                getNotificationColor(notification.type),
                notification.read && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn('font-medium text-sm', !notification.read && 'font-semibold')}
                    >
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{notification.timestamp}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {notifications.length > maxItems && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View all ({notifications.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

