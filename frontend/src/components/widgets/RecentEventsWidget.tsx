'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Event {
  id: string | number
  title: string
  description: string
  type: 'user' | 'system' | 'order' | 'payment' | 'other'
  timestamp: string
  user?: string
}

interface RecentEventsWidgetProps {
  config?: {
    maxItems?: number
    showTimestamp?: boolean
  }
  data?: any[] // Real data from API
  className?: string
}

/**
 * Recent Events Widget - Hiển thị danh sách sự kiện gần đây
 * Transforms real work order data into event display
 * 
 * @param config - Config cho widget (maxItems, showTimestamp)
 * @param data - Data từ API (work orders hoặc appointments)
 * @param className - Additional CSS classes
 */
export default function RecentEventsWidget({ 
  config = {}, 
  data = [],
  className 
}: RecentEventsWidgetProps) {
  const { maxItems = 10, showTimestamp = true } = config

  // Transform API data (work orders/appointments) into events
  const transformedEvents: Event[] = (Array.isArray(data) ? data : [])
    .slice(0, maxItems)
    .map((item: any, idx: number) => {
      // Handle work orders
      if (item.WorkOrderID) {
        const timeAgo = item.CreatedAt ? new Date(item.CreatedAt) : new Date()
        return {
          id: item.WorkOrderID,
          title: `Work Order #${item.WorkOrderID}`,
          description: `Status: ${item.Status || 'Pending'} - ${item.ServiceName || 'Service Work'}`,
          type: 'order',
          timestamp: formatTimeAgo(timeAgo),
          user: item.TechnicianName || 'Assigned',
        }
      }
      // Handle appointments
      if (item.AppointmentID) {
        const timeAgo = item.ScheduledDate ? new Date(item.ScheduledDate) : new Date()
        return {
          id: item.AppointmentID,
          title: `Appointment #${item.AppointmentID}`,
          description: `${item.Status || 'Pending'} - ${item.ServiceName || 'Service'}`,
          type: 'order',
          timestamp: formatTimeAgo(timeAgo),
          user: item.AccountName || 'Customer',
        }
      }
      return null
    })
    .filter((e: Event | null): e is Event => e !== null)

  // Default data nếu không có data từ props
  const defaultData: Event[] = [
    {
      id: '1',
      title: 'New Order Created',
      description: 'Order #12345 was created by John Doe',
      type: 'order',
      timestamp: '5 minutes ago',
      user: 'John Doe',
    },
    {
      id: '2',
      title: 'Payment Processed',
      description: 'Payment of $250.00 was successfully processed',
      type: 'payment',
      timestamp: '15 minutes ago',
    },
    {
      id: '3',
      title: 'User Login',
      description: 'Jane Smith logged into the system',
      type: 'user',
      timestamp: '30 minutes ago',
      user: 'Jane Smith',
    },
    {
      id: '4',
      title: 'System Backup',
      description: 'Automated backup completed successfully',
      type: 'system',
      timestamp: '1 hour ago',
    },
    {
      id: '5',
      title: 'Vehicle Service Scheduled',
      description: 'Service appointment scheduled for tomorrow',
      type: 'other',
      timestamp: '2 hours ago',
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
  const events = transformedEvents.length > 0 
    ? transformedEvents 
    : []

  // Kiểm tra events có data không
  if (!events || events.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Sự kiện gần đây trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent events</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  /**
   * Get event icon based on type
   */
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤'
      case 'system':
        return '⚙️'
      case 'order':
        return '📦'
      case 'payment':
        return '💳'
      default:
        return '📄'
    }
  }

  /**
   * Get event color based on type
   */
  const getEventColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800'
      case 'system':
        return 'bg-gray-100 text-gray-800'
      case 'order':
        return 'bg-purple-100 text-purple-800'
      case 'payment':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  /**
   * Get user initials
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Sự kiện gần đây trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {events.slice(0, maxItems).map((event, index) => (
            <div key={event.id} className="flex items-start gap-4">
              {/* Timeline line */}
              {index < events.length - 1 && (
                <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-border" />
              )}

              {/* Event icon */}
              <div className={cn(
                'relative z-10 flex items-center justify-center w-12 h-12 rounded-full shrink-0',
                getEventColor(event.type)
              )}>
                <span className="text-lg">{getEventIcon(event.type)}</span>
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                    {event.user && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {getInitials(event.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {event.user}
                        </span>
                      </div>
                    )}
                  </div>
                  {showTimestamp && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {event.timestamp}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent events</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

