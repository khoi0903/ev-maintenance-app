'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CTACardWidgetProps {
  className?: string
}

/**
 * CTA Card Widget - Nút kêu gọi hành động "Đặt Lịch Dịch vụ Mới"
 */
export default function CTACardWidget({ className }: CTACardWidgetProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Đặt Lịch Dịch vụ Mới</CardTitle>
        <CardDescription>Đặt lịch hẹn bảo dưỡng hoặc sửa chữa</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <Link
            href="/user/appointments/new"
            className={cn(
              'inline-block px-8 py-4 bg-green-600 hover:bg-green-700',
              'text-white font-semibold text-lg rounded-lg uppercase',
              'transition-all duration-300 transform hover:scale-105',
              'shadow-lg hover:shadow-xl w-full text-center'
            )}
          >
            ĐẶT LỊCH NGAY
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

