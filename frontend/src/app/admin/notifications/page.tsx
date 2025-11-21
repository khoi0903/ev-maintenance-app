'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'

interface Notification {
  id: string
  senderName: string
  senderAvatar?: string
  message: string
  timeAgo: string
  unread?: boolean
  category?: string
}

/**
 * Notifications Page - Trang xem tất cả thông báo
 */
export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const formatTimeAgo = (date: any) => {
    if (!date) return 'vừa xong'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return d.toLocaleDateString('vi-VN')
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await adminService.getNotifications(50)
        
        if (!active) return

        if (res.success && Array.isArray(res.data)) {
          // Map API response to Notification interface
          const mapped = res.data.map((n: any, idx: number) => ({
            // Prefer server-provided NotificationID for stable keys
            id: String(n.NotificationID ?? n.id ?? idx),
            senderName: n.senderName || n.SenderName || 'System',
            senderAvatar: n.senderAvatar || n.SenderAvatar,
            message: n.message || n.Message || '',
            timeAgo: n.timeAgo || n.TimeAgo || formatTimeAgo(n.CreatedAt || new Date()),
            // Determine unread: use explicit flag if present, otherwise infer from IsRead
            unread: n.unread ?? (n.IsRead !== undefined ? !Boolean(n.IsRead) : true),
            category: n.category || n.Category,
          }))
          setNotifications(mapped)
        } else {
          setError('Không thể tải thông báo')
        }
      } catch (err: any) {
        if (!active) return
        console.error('Load notifications error:', err)
        setError(err?.message || 'Lỗi khi tải thông báo')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingId(notificationId)
      const res = await adminService.markNotificationAsRead(notificationId)
      if (res.success) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, unread: false } : n
        ))
      }
    } catch (err: any) {
      console.error('Mark as read error:', err)
    } finally {
      setMarkingId(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return n.unread
    if (filter === 'read') return !n.unread
    return true
  })

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Xem tất cả thông báo của bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {unreadCount} chưa đọc
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              Chưa đọc ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === 'read'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              Đã đọc ({notifications.length - unreadCount})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo</CardTitle>
          <CardDescription>
            {loading ? 'Đang tải...' : `${filteredNotifications.length} thông báo`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Đang tải thông báo...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Không có thông báo nào
              </div>
            ) : (
              filteredNotifications.map((notification, idx) => (
                <div
                  key={`${notification.id}-${idx}`}
                  onClick={() => {
                    if (notification.unread) {
                      handleMarkAsRead(notification.id)
                    }
                  }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    notification.unread && 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700',
                    markingId === notification.id && 'opacity-60'
                  )}
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={notification.senderAvatar} alt={notification.senderName} />
                    <AvatarFallback>{getInitials(notification.senderName)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.senderName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {notification.timeAgo}
                          </p>
                          {notification.category && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded">
                              {notification.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {notification.unread && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

