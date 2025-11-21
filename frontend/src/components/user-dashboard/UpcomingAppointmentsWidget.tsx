'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  date: string
  serviceType: string
  status: 'Confirmed' | 'Pending' | 'Cancelled'
  time?: string
}

interface UpcomingAppointmentsWidgetProps {
  appointments?: Appointment[]
  className?: string
}

/**
 * Upcoming Appointments Widget - Hiển thị lịch hẹn gần nhất
 */
export default function UpcomingAppointmentsWidget({ 
  appointments,
  className 
}: UpcomingAppointmentsWidgetProps) {
  const defaultAppointments: Appointment[] = [
    {
      id: '1',
      date: '2024-11-15',
      serviceType: 'Bảo dưỡng định kỳ',
      status: 'Confirmed',
      time: '09:00',
    },
    {
      id: '2',
      date: '2024-11-20',
      serviceType: 'Kiểm tra Pin',
      status: 'Pending',
      time: '14:00',
    },
    {
      id: '3',
      date: '2024-11-25',
      serviceType: 'Thay dầu',
      status: 'Confirmed',
      time: '10:30',
    },
  ]

  const displayAppointments = appointments || defaultAppointments

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Lịch hẹn Gần nhất</CardTitle>
        <CardDescription>3 lịch hẹn sắp tới của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayAppointments.slice(0, 3).map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatDate(appointment.date)}
                  </span>
                  {appointment.time && (
                    <span className="text-sm text-muted-foreground">
                      {appointment.time}
                    </span>
                  )}
                </div>
                <p className="font-medium text-sm mb-1">{appointment.serviceType}</p>
                <span
                  className={cn(
                    'inline-block px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(appointment.status)
                  )}
                >
                  {appointment.status === 'Confirmed'
                    ? 'Đã xác nhận'
                    : appointment.status === 'Pending'
                    ? 'Chờ xác nhận'
                    : 'Đã hủy'}
                </span>
              </div>
            </div>
          ))}

          {displayAppointments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Chưa có lịch hẹn nào
            </p>
          )}

          <div className="pt-4 border-t">
            <Link href="/user/appointments">
              <Button variant="outline" className="w-full">
                Xem Tất cả Lịch hẹn
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

