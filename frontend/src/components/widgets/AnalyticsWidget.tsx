'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AnalyticsWidgetProps {
  config?: {
    showChart?: boolean
    metrics?: string[]
  }
  data?: any[] // Real data from API (work orders, etc.)
  className?: string
}

/**
 * Analytics Widget - Hiển thị các metrics tổng quan
 * 
 * @param config - Config cho widget (showChart, metrics)
 * @param data - Data từ API hoặc props
 * @param className - Additional CSS classes
 */
export default function AnalyticsWidget({ 
  config = {}, 
  data = [],
  className 
}: AnalyticsWidgetProps) {
  const { showChart = true, metrics = ['workorders', 'invoices', 'appointments', 'vehicles'] } = config

  // Compute metrics from real API data (work orders list)
  const workOrders = (Array.isArray(data) ? data : []).filter((wo: any) => wo.WorkOrderID)
  const workordersCount = workOrders.length
  const totalAmount = workOrders.reduce((sum: number, wo: any) => sum + (Number(wo.TotalAmount) || 0), 0)
  const completedCount = workOrders.filter((wo: any) => wo.Status === 'Done' || wo.Status === 'Completed').length

  // Default analytics
  const analyticsData = {
    workorders: workordersCount,
    invoices: Math.floor(workordersCount * 0.8), // Rough estimate
    appointments: Math.ceil(workordersCount * 1.2),
    vehicles: Math.floor(workordersCount * 0.5),
    revenue: totalAmount,
    completed: completedCount,
  }

  /**
   * Format số với dấu phẩy
   */
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  /**
   * Format currency
   */
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
        <CardDescription>Thống kê tổng quan hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.includes('workorders') && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Work Orders</p>
              <p className="text-2xl font-bold">{formatNumber(analyticsData.workorders)}</p>
              <p className="text-xs text-green-600">+{completedCount} completed</p>
            </div>
          )}

          {metrics.includes('invoices') && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Invoices</p>
              <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue)}</p>
              <p className="text-xs text-green-600">Total revenue</p>
            </div>
          )}

          {metrics.includes('appointments') && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Appointments</p>
              <p className="text-2xl font-bold">{formatNumber(analyticsData.appointments)}</p>
              <p className="text-xs text-green-600">Scheduled</p>
            </div>
          )}

          {metrics.includes('vehicles') && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Vehicles</p>
              <p className="text-2xl font-bold">{formatNumber(analyticsData.vehicles)}</p>
              <p className="text-xs text-green-600">Registered</p>
            </div>
          )}
        </div>

        {showChart && (
          <div className="mt-6 h-32 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chart visualization would go here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




