// app/user/progress/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { userService } from '@/services/user.service'
import type { CurrentWorkOrderDto, CompletedWorkOrderDto } from '@/types/workorder'
import type { Appointment } from '@/types/entities'

function formatDateTime(dt?: string | null) {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return dt
  }
}

function formatCurrency(amount: number | undefined | null) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(amount || 0))
}

// Màu trạng thái cho Appointment
const APPT_STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function UserProgressPage() {
  const router = useRouter()

  const [active, setActive] = useState<CurrentWorkOrderDto[]>([])
  const [completed, setCompleted] = useState<CompletedWorkOrderDto[]>([])
  const [waitingAppointments, setWaitingAppointments] = useState<Appointment[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // Gọi luôn cả 3: active workorders, completed workorders, appointments của user
        const [rawActive, rawCompleted, rawAppts] = await Promise.all([
          userService.getMyActiveWorkOrders(),
          userService.getMyCompletedWorkOrders(),
          userService.myAppointments(),
        ])

        if (!alive) return

        // Active workorders
        if (rawActive?.success && Array.isArray(rawActive.data)) {
          setActive(rawActive.data)
        } else {
          setActive([])
        }

        // Completed workorders
        if (rawCompleted?.success && Array.isArray(rawCompleted.data)) {
          setCompleted(rawCompleted.data)
        } else {
          setCompleted([])
        }

        // Appointments đang chờ xác nhận
        if (rawAppts?.success && Array.isArray(rawAppts.data)) {
          const apps = rawAppts.data as Appointment[]
          const waiting = apps.filter((a: any) => {
            const st = a.Status || a.status || 'Pending'
            // định nghĩa: cái gì đang đợi xác nhận thì lên đây
            return st === 'Pending' })
          setWaitingAppointments(waiting)
        } else {
          setWaitingAppointments([])
        }
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Không thể tải danh sách công việc')
        setActive([])
        setCompleted([])
        setWaitingAppointments([])
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const renderProgressBar = (val?: number | null) => {
    const pct = Math.min(Math.max(Number(val || 0), 0), 100)
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Tiến độ</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-green-600 dark:bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Đang tải tiến độ công việc...</p>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tiến độ sửa chữa</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi các lịch hẹn, công việc đang xử lý và lịch sử đã hoàn tất cho xe của bạn.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/user/service')}>
          Đặt dịch vụ mới
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10">
          <CardContent className="pt-4">
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* --- Lịch hẹn chờ xác nhận --- */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn chờ xác nhận</CardTitle>
          <CardDescription>
            Các lịch hẹn bạn vừa tạo hoặc đang được nhân viên kiểm tra, chưa chuyển thành WorkOrder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {waitingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Hiện tại bạn không có lịch hẹn nào đang chờ xác nhận.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              {waitingAppointments.map((a: any) => {
                const st = a.Status || a.status || 'Pending'
                const badgeClass =
                  APPT_STATUS_COLORS[st] || 'bg-gray-100 text-gray-700'

                const slotStart = a.SlotStart || a.slotStart || null
                const slotEnd = a.SlotEnd || a.slotEnd || null
                const timeText = slotStart
                  ? `${new Date(slotStart).toLocaleString('vi-VN')} ${
                      slotEnd
                        ? ' - ' + new Date(slotEnd).toLocaleTimeString('vi-VN')
                        : ''
                    }`
                  : formatDateTime(a.ScheduledDate)

                return (
                  <div
                    key={a.AppointmentID}
                    className="w-full rounded-lg border border-border/70 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Lịch hẹn #{a.AppointmentID}
                      </div>
                      <div className="text-sm font-semibold">
                        {a.ServiceName || a.serviceName || 'Dịch vụ EV Maintenance'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Thời gian: {timeText}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Xe: <b>{a.LicensePlate || a.licensePlate || '—'}</b>{' '}
                        {a.VIN || a.vin ? `• VIN: ${a.VIN || a.vin}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <span
                        className={
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                          badgeClass
                        }
                      >
                        
                          { 'Đang chờ xác nhận'}
                    
                      </span>
                      {/* Nếu muốn sau này có nút xem chi tiết lịch hẹn thì thêm ở đây */}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Công việc đang thực hiện (WorkOrder Active) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Công việc đang thực hiện</CardTitle>
          <CardDescription>
            Bao gồm các công việc đang ở trạng thái <b>Pending</b>, <b>InProgress</b> hoặc{' '}
            <b>Confirmed</b>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Hiện tại bạn không có công việc nào đang được xử lý.
            </p>
          ) : (
            <div className="space-y-3">
              {active.map((w: any) => (
                <button
                  key={w.WorkOrderID}
                  type="button"
                  onClick={() => router.push(`/user/workorders/${w.WorkOrderID}`)}
                  className="w-full text-left rounded-lg border border-border/70 hover:border-green-500 hover:bg-green-50/40 dark:hover:bg-green-900/10 px-4 py-3 transition-colors"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Biển số: <b>{w.LicensePlate || '—'}</b>
                      </div>
                      <div className="font-semibold text-sm">
                        {w.ServiceName || 'Dịch vụ EV Maintenance'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Trạng thái: <b>{w.Status}</b>
                      </div>
                      {w.StartedAt && (
                        <div className="text-xs text-muted-foreground">
                          Bắt đầu: {formatDateTime(w.StartedAt)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Mã công việc</div>
                      <div className="font-semibold text-foreground">#{w.WorkOrderID}</div>
                    </div>
                  </div>
                  {renderProgressBar(w.Progress)}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Lịch sử công việc đã hoàn tất --- */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử công việc đã hoàn tất</CardTitle>
          <CardDescription>
            Chỉ hiển thị các công việc đã <b>Done / Completed</b>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có công việc nào hoàn tất. Khi công việc được đánh dấu Done, bạn sẽ thấy ở đây.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              {completed.map((w: any) => (
                <button
                  key={w.WorkOrderID}
                  type="button"
                  onClick={() => router.push(`/user/workorders/${w.WorkOrderID}`)}
                  className="w-full text-left rounded-lg border border-border/70 hover:border-green-500 hover:bg-green-50/40 dark:hover:bg-green-900/10 px-4 py-3 transition-colors"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Biển số: <b>{w.LicensePlate || '—'}</b>
                      </div>
                      <div className="font-semibold">
                        {w.ServiceName || 'Dịch vụ EV Maintenance'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Hoàn tất lúc: {formatDateTime(w.CompletedAt || w.CompletedDate)}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Mã công việc</div>
                      <div className="font-semibold text-foreground">#{w.WorkOrderID}</div>
                      {w.TotalAmount != null && (
                        <div className="mt-1">
                          {formatCurrency(Number(w.TotalAmount || w.TotalCost || 0))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
