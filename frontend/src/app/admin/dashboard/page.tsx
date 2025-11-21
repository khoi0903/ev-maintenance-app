'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardGrid from '@/components/dashboard/DashboardGrid'
import { getDashboardWidgetsConfig, WidgetConfig } from '@/config/dashboard.config'
import { getUser } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    const role = user?.Role
    
    // Technician redirect to their work orders page
    if (role === 'Technician') {
      router.replace('/admin/work-orders/technician')
      return
    }

    // Staff redirect to appointments page
    if (role === 'Staff') {
      router.replace('/admin/appointments')
      return
    }

    const loadWidgets = async () => {
      try {
        const config = await getDashboardWidgetsConfig()
        setWidgets(config)
      } catch (error) {
        console.error('Failed to load dashboard widgets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWidgets()
  }, [router])

  // If technician or staff, don't render anything (will redirect)
  const user = getUser()
  if (user?.Role === 'Technician' || user?.Role === 'Staff') {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Tổng quan hệ thống và thống kê
        </p>
      </div>

      <DashboardGrid widgets={widgets} />
    </div>
  )
}
