'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dropdown } from '@/components/ui/dropdown/Dropdown'
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem'
import { cn } from '@/lib/utils'
import { userService } from '@/services/user.service'
import { UserNotificationList, type UserNotificationItem } from '@/components/user-layout/UserNotificationBar'

const DISMISSED_KEY = 'userNotifications:dismissed'
const COMPLETED_TRACK_KEY = 'userNotifications:completedSeen'
const RECENT_APPT_KEY = 'recentAppointmentSuccess'

interface UserHeaderProps {
  userName?: string
  userAvatar?: string
  sidebarCollapsed?: boolean
}

export default function UserHeader({
  userName: propUserName = 'Customer User',
  userAvatar: propUserAvatar,
  sidebarCollapsed = false,
}: UserHeaderProps) {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dismissedRef = useRef<Set<string>>(new Set())
  const [notificationOpen, setNotificationOpen] = useState(false)

  // 👇 state hiển thị – luôn sync với storage
  const [displayName, setDisplayName] = useState(propUserName)
  const [displayAvatar, setDisplayAvatar] = useState<string | undefined>(propUserAvatar)
  const [displayRole, setDisplayRole] = useState<string>('Khách hàng')
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false)

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const readDismissed = () => {
    if (typeof window === 'undefined') return new Set<string>()
    try {
      const raw = localStorage.getItem(DISMISSED_KEY)
      if (!raw) return new Set<string>()
      const arr: string[] = JSON.parse(raw)
      return new Set(arr)
    } catch {
      return new Set<string>()
    }
  }

  const saveDismissed = (next: Set<string>) => {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)))
    } catch {
      // ignore
    }
  }

  const markCompletedSeen = (workOrderId: number) => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(COMPLETED_TRACK_KEY)
      const arr: number[] = raw ? JSON.parse(raw) : []
      if (!arr.includes(workOrderId)) {
        arr.push(workOrderId)
        localStorage.setItem(COMPLETED_TRACK_KEY, JSON.stringify(arr))
      }
    } catch {
      // ignore
    }
  }

  const hasCompletedSeen = (workOrderId: number) => {
    if (typeof window === 'undefined') return false
    try {
      const raw = localStorage.getItem(COMPLETED_TRACK_KEY)
      const arr: number[] = raw ? JSON.parse(raw) : []
      return arr.includes(workOrderId)
    } catch {
      return false
    }
  }

  // 🔄 Load user từ storage + lắng nghe sự kiện cập nhật
  useEffect(() => {
    const loadUser = () => {
      const s = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (!s) return
      try {
        const u = JSON.parse(s)
        setDisplayName(u.FullName || u.Username || propUserName)
        setDisplayAvatar(u.avatar || propUserAvatar)
        const role = (u.Role || 'Customer') as string
        setDisplayRole(role === 'Admin' ? 'Quản trị'
                         : role === 'Staff' ? 'Nhân viên'
                         : role === 'Technician' ? 'Kỹ thuật'
                         : 'Khách hàng')
      } catch {}
    }

    // load khi mount
    loadUser()

    // 👂 nghe event “user:updated” (bắn ra từ trang Profile sau khi lưu)
    const onUserUpdated = () => loadUser()
    window.addEventListener('user:updated', onUserUpdated)

    // 👂 nghe cả sự kiện storage (khi tab khác đổi thông tin)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') loadUser()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('user:updated', onUserUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [propUserName, propUserAvatar])

  const buildNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return
    setLoadingNotifications(true)
    const next: UserNotificationItem[] = []
    const dismissed = dismissedRef.current

    // 1. Recent appointment success stored in sessionStorage
    try {
      const recentStr = sessionStorage.getItem(RECENT_APPT_KEY)
      if (recentStr) {
        const recent = JSON.parse(recentStr) as {
          AppointmentID?: number
          ServiceName?: string
          ScheduledDate?: string
        }
        if (recent?.AppointmentID) {
          const id = `appointment-success-${recent.AppointmentID}`
          if (!dismissed.has(id)) {
            const scheduled = recent.ScheduledDate
              ? new Date(recent.ScheduledDate).toLocaleString('vi-VN')
              : ''
            next.push({
              id,
              tone: 'success',
              title: 'Đặt lịch thành công',
              message: `Lịch ${
                recent.ServiceName || 'bảo dưỡng'
              } đã được gửi. Chúng tôi sẽ xác nhận trước ${scheduled || 'thời gian sớm nhất'}.`,
              actionLabel: 'Xem tiến độ',
              actionHref: '/user/progress',
            })
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      const [completedRes, invoiceRes] = await Promise.all([
        userService.getMyCompletedWorkOrders(),
        userService.myInvoices(),
      ])

      const completedList = completedRes?.success ? completedRes.data || [] : []
      if (Array.isArray(completedList)) {
        completedList.slice(0, 3).forEach((item) => {
          if (!item?.WorkOrderID) return
          if (hasCompletedSeen(item.WorkOrderID)) return
          const id = `workorder-done-${item.WorkOrderID}`
          if (dismissed.has(id)) return
          const finishedAt = item.CompletedDate
            ? new Date(item.CompletedDate).toLocaleString('vi-VN')
            : ''
          next.push({
            id,
            tone: 'info',
            title: 'Kỹ thuật viên đã hoàn tất',
            message: `Dịch vụ ${item.ServiceName || '#'+item.WorkOrderID} đã hoàn tất lúc ${finishedAt}. Nhân viên sẽ gửi hóa đơn ngay.`,
            actionLabel: 'Theo dõi chi tiết',
            actionHref: '/user/progress',
          })
        })
      }

      const invoices = invoiceRes?.success ? invoiceRes.data || [] : []
      if (Array.isArray(invoices)) {
        invoices
          .filter(
            (inv) =>
              inv &&
              !dismissed.has(`invoice-${inv.InvoiceID}`) &&
              inv.PaymentStatus === 'Unpaid' &&
              (inv.WorkOrderStatus === 'Done' || inv.WorkOrderStatus === 'Completed') &&
              !!inv.SentToCustomerAt
          )
          .slice(0, 3)
          .forEach((inv) => {
            const sentAt = inv.SentToCustomerAt
              ? new Date(inv.SentToCustomerAt).toLocaleString('vi-VN')
              : ''
            next.push({
              id: `invoice-${inv.InvoiceID}`,
              tone: 'warning',
              title: 'Yêu cầu thanh toán',
              message: `Hóa đơn #${inv.InvoiceID} đã được nhân viên gửi ngày ${sentAt}. Tổng cần thanh toán: ${Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(inv.TotalAmount || 0)}.`,
              actionLabel: 'Thanh toán ngay',
              actionHref: `/user/payment?invoiceId=${inv.InvoiceID}`,
            })
          })
      }
    } catch (err) {
      console.error('[UserHeader] load notifications error:', err)
    } finally {
      setNotifications(next)
      setLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    dismissedRef.current = readDismissed()
    buildNotifications()
    const refresh = () => buildNotifications()
    window.addEventListener('focus', refresh)
    window.addEventListener('user:refresh-notifications', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('user:refresh-notifications', refresh)
    }
  }, [buildNotifications])

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const next = new Set(dismissedRef.current)
    next.add(id)
    dismissedRef.current = next
    saveDismissed(next)

    if (id.startsWith('appointment-success') && typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(RECENT_APPT_KEY)
      } catch {}
    }
    if (id.startsWith('workorder-done-')) {
      const idNum = Number(id.replace('workorder-done-', ''))
      if (!Number.isNaN(idNum)) {
        markCompletedSeen(idNum)
      }
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.clear()
    // thông báo các header khác (nếu có) sync ngay
    window.dispatchEvent(new Event('user:updated'))
    router.push('/signin')
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 bg-white dark:bg-gray-900 border-b z-30 transition-all duration-300 shadow-sm h-16',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="px-6 h-full flex items-center justify-between">
        {/* Left */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trung tâm Bảo hành
          </h2>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className={cn(
                'relative w-10 h-10 rounded-full flex items-center justify-center',
                'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
                'text-gray-700 dark:text-gray-200 transition-colors',
                notificationOpen && 'bg-gray-200 dark:bg-gray-700'
              )}
              onClick={() => setNotificationOpen((o) => !o)}
            >
              <span className="text-xl">🔔</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            <Dropdown
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
              className="w-96 mt-2"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Thông báo
                  </p>
                  {notifications.length > 0 && (
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        notifications.forEach((n) => dismissNotification(n.id))
                      }}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                {loadingNotifications ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Đang tải thông báo...
                  </div>
                ) : (
                  <UserNotificationList
                    notifications={notifications}
                    onDismiss={(id) => {
                      dismissNotification(id)
                      if (notifications.length <= 1) {
                        setNotificationOpen(false)
                      }
                    }}
                  />
                )}
              </div>
            </Dropdown>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {displayRole}
                </p>
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="bg-green-600 text-white">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </button>

            <Dropdown
              isOpen={userMenuOpen}
              onClose={() => setUserMenuOpen(false)}
              className="w-56 mt-2"
            >
              <div className="p-2">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {displayRole}
                  </p>
                </div>

                <div className="py-1">
                  <DropdownItem
                    tag="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      router.push('/user/profile')
                    }}
                    baseClassName="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-lg">✏️</span>
                    <span>Hồ sơ của tôi</span>
                  </DropdownItem>

                  <DropdownItem
                    tag="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      router.push('/user/settings')
                    }}
                    baseClassName="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-lg">⚙️</span>
                    <span>Cài đặt</span>
                  </DropdownItem>

                  <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                  <DropdownItem
                    tag="button"
                    onClick={handleSignOut}
                    baseClassName="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Đăng xuất</span>
                  </DropdownItem>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  )
}
