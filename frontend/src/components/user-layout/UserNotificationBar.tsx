'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UserNotificationTone = 'success' | 'info' | 'warning'

export interface UserNotificationItem {
  id: string
  tone: UserNotificationTone
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
}

interface UserNotificationListProps {
  notifications: UserNotificationItem[]
  onDismiss: (id: string) => void
}

const toneStyles: Record<UserNotificationTone, { bg: string; border: string; accent: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    accent: 'text-emerald-700 dark:text-emerald-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800/60',
    accent: 'text-blue-700 dark:text-blue-200',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800/60',
    accent: 'text-amber-700 dark:text-amber-200',
  },
}

const toneIcons: Record<UserNotificationTone, string> = {
  success: '✅',
  info: 'ℹ️',
  warning: '⚠️',
}

export function UserNotificationList({ notifications, onDismiss }: UserNotificationListProps) {
  if (!notifications.length) {
    return (
      <div className="text-center text-sm text-muted-foreground py-6">
        Chưa có thông báo mới
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notif) => {
        const tone = toneStyles[notif.tone]
        return (
          <div
            key={notif.id}
            className={cn(
              'rounded-xl border px-4 py-3 flex items-start gap-3 shadow-sm',
              tone.bg,
              tone.border
            )}
          >
            <div className="text-xl leading-none">{toneIcons[notif.tone]}</div>
            <div className="flex-1">
              <p className={cn('text-sm font-semibold', tone.accent)}>{notif.title}</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5">{notif.message}</p>
              {notif.actionHref && notif.actionLabel && (
                <Link
                  href={notif.actionHref}
                  className="inline-flex text-sm font-medium text-primary mt-2 hover:underline"
                >
                  {notif.actionLabel} →
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notif.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

