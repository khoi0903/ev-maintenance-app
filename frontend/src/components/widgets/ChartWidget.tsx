'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  label: string
  value: number
}

interface ChartWidgetProps {
  config?: {
    chartType?: 'line' | 'bar' | 'pie' | 'area'
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
  data?: any[] // Real data from API (appointments or work orders)
  className?: string
}

/**
 * Chart Widget - Hiển thị biểu đồ
 * Transforms real appointment/work order data into status distribution chart
 * 
 * @param config - Config cho widget (chartType, period)
 * @param data - Data từ API (appointments or work orders)
 * @param className - Additional CSS classes
 */
export default function ChartWidget({ 
  config = {}, 
  data = [],
  className 
}: ChartWidgetProps) {
  const { chartType = 'bar', period = 'monthly' } = config

  // Transform API data (appointments) into chart format by status
  const transformedData: ChartDataPoint[] = Object.entries(
    (Array.isArray(data) ? data : [])
      .reduce((acc: Record<string, number>, item: any) => {
        let status = 'Other'
        
        // Extract status from appointment or work order
        if (item.Status) {
          status = item.Status
        } else if (item.AppointmentStatus) {
          status = item.AppointmentStatus
        }
        
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
  ).map(([label, value]) => ({ label, value: value as number }))

  // Đảm bảo data không null và là array
  const chartData = transformedData.length > 0 
    ? transformedData 
    : []

  // Kiểm tra chartData có data không
  if (!chartData || chartData.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Revenue Chart</CardTitle>
          <CardDescription>
            Biểu đồ doanh thu theo {period === 'monthly' ? 'tháng' : period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No chart data available</p>
        </CardContent>
      </Card>
    )
  }

  /**
   * Calculate max value for scaling
   */
  const maxValue = Math.max(...chartData.map((d) => d.value))

  /**
   * Render simple bar chart
   */
  const renderBarChart = () => {
    return (
      <div className="flex items-end gap-2 h-48">
        {chartData.map((point, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center justify-end h-full">
              <div
                className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${(point.value / maxValue) * 100}%`,
                  minHeight: '4px',
                }}
                title={`${point.label}: ${point.value}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
    )
  }

  /**
   * Render simple line chart
   */
  const renderLineChart = () => {
    return (
      <div className="h-48 relative">
        <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={chartData
              .map(
                (point, index) =>
                  `${(index / (chartData.length - 1)) * 400},${
                    150 - (point.value / maxValue) * 150
                  }`
              )
              .join(' ')}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between">
          {chartData.map((point, index) => (
            <span key={index} className="text-xs text-muted-foreground">
              {point.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Revenue Chart</CardTitle>
        <CardDescription>
          Biểu đồ doanh thu theo {period === 'monthly' ? 'tháng' : period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart type selector (có thể thêm vào UI) */}
          <div className="text-sm text-muted-foreground">
            Type: {chartType} | Period: {period}
          </div>

          {/* Chart visualization */}
          <div className="mt-4">
            {chartType === 'bar' ? renderBarChart() : renderLineChart()}
          </div>

          {/* Chart legend/info */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">
                ${chartData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-xl font-semibold">
                ${Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

