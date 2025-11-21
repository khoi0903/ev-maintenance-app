'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LineChartOne from '@/components/charts/line/LineChartOne'
import { ApexOptions } from 'apexcharts'
import { http } from '@/lib/api'
import type { ApiResp } from '@/types/common'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface TrendPoint {
  Month: number
  CreatedCount: number
  CompletedCount: number
}

export default function AnalyticsPage() {
  const [selectedYear, setSelectedYear] = useState('2025')
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await http.get<ApiResp<TrendPoint[]>>(`/report/workorders/monthly?year=${selectedYear}`)
        if (res.success) {
          setTrendData(res.data || [])
        } else {
          setTrendData([])
          setError(res.message || 'Không thể tải dữ liệu xu hướng work order')
        }
      } catch (err: any) {
        setTrendData([])
        setError(err?.message || 'Không thể tải dữ liệu xu hướng work order')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedYear])

  const completedSeries = useMemo(
    () =>
      MONTH_LABELS.map((_, idx) => {
        const point = trendData.find((p) => p.Month === idx + 1)
        return point ? point.CompletedCount : 0
      }),
    [trendData]
  )

  const createdSeries = useMemo(
    () =>
      MONTH_LABELS.map((_, idx) => {
        const point = trendData.find((p) => p.Month === idx + 1)
        return point ? point.CreatedCount : 0
      }),
    [trendData]
  )

  const chartSeries = [
    {
      name: 'Total Work Orders Completed (Tổng Công việc Hoàn thành)',
      data: completedSeries,
    },
    {
      name: 'Total Work Orders Created (Tổng Công việc Mới tạo)',
      data: createdSeries,
    },
  ]

  const chartOptions: Partial<ApexOptions> = {
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#16a34a', '#2563eb'],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} work orders`,
      },
    },
  }

  const totalCompleted = completedSeries.reduce((a, b) => a + b, 0)
  const totalCreated = createdSeries.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Monthly Work Order Trend (Xu hướng Công việc Hàng tháng)
          </h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi số lượng Work Order được tạo và hoàn thành từng tháng trong năm {selectedYear}
          </p>
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Work Order Trend (Xu hướng Công việc Hàng tháng)</CardTitle>
          <CardDescription>
            So sánh số lượng công việc mới tạo và hoàn thành mỗi tháng trong năm {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <LineChartOne series={chartSeries} options={chartOptions} height={400} />
          {loading && (
            <p className="text-sm text-muted-foreground mt-2">Đang tải dữ liệu biểu đồ…</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Total Work Orders Completed (Tổng Công việc Hoàn thành)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalCompleted}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Tổng số công việc đã hoàn thành trong năm {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Total Work Orders Created (Tổng Công việc Mới tạo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalCreated}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Tổng số công việc mới tạo trong năm {selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

