'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'
import { cn } from '@/lib/utils'

/**
 * Report Type Enum
 */
type ReportType = 'warranty-cost' | 'service-performance' | 'battery-soh' | null

/**
 * Reports Page - Trang báo cáo & phân tích
 */
export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null)
  const [dateRange, setDateRange] = useState<'last-month' | 'last-quarter' | 'last-year' | 'custom'>('last-month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [serviceCenter, setServiceCenter] = useState<string>('All')

  const reportTypes = [
    {
      id: 'warranty-cost',
      title: 'Chi phí Bảo hành',
      description: 'Phân tích chi phí bảo hành theo thời gian',
      icon: '💰',
    },
    {
      id: 'service-performance',
      title: 'Hiệu suất Dịch vụ',
      description: 'Thống kê hiệu suất và thời gian hoàn thành dịch vụ',
      icon: '⚡',
    },
    {
      id: 'battery-soh',
      title: 'Tình trạng Pin (SOH)',
      description: 'Báo cáo về State of Health của pin xe',
      icon: '🔋',
    },
  ]

  const serviceCenters = [
    'All',
    'Trung tâm Hà Nội',
    'Trung tâm TP.HCM',
    'Trung tâm Đà Nẵng',
    'Đại lý Cần Thơ',
  ]

  const handleGenerateReport = () => {
    // Implement generate report logic here
    console.log('Generating report...', {
      selectedReport,
      dateRange,
      customStartDate,
      customEndDate,
      serviceCenter,
    })
  }

  const handleExportCSV = () => {
    // Implement export CSV logic here
    console.log('Exporting to CSV...')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Báo cáo và thống kê
        </p>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn Loại Báo cáo</CardTitle>
          <CardDescription>
            Chọn một loại báo cáo để xem thống kê
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report.id as ReportType)}
                className={cn(
                  'p-6 border-2 rounded-lg cursor-pointer transition-all hover:border-primary',
                  selectedReport === report.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                )}
              >
                <div className="text-4xl mb-3">{report.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                <p className="text-sm text-muted-foreground">{report.description}</p>
                {selectedReport === report.id && (
                  <div className="mt-4">
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Đã chọn
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Setup Form */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Thiết lập Báo cáo</CardTitle>
            <CardDescription>
              Cấu hình các thông số cho báo cáo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Date Range */}
              <div>
                <Label>Khoảng thời gian</Label>
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dateRange"
                        value="last-month"
                        checked={dateRange === 'last-month'}
                        onChange={() => setDateRange('last-month')}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Tháng trước</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dateRange"
                        value="last-quarter"
                        checked={dateRange === 'last-quarter'}
                        onChange={() => setDateRange('last-quarter')}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Quý trước</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dateRange"
                        value="last-year"
                        checked={dateRange === 'last-year'}
                        onChange={() => setDateRange('last-year')}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Năm trước</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dateRange"
                        value="custom"
                        checked={dateRange === 'custom'}
                        onChange={() => setDateRange('custom')}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Tùy chỉnh</span>
                    </label>
                  </div>

                  {dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label>Từ ngày</Label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Đến ngày</Label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Center Filter */}
              <div>
                <Label>Đại lý/Trung tâm Dịch vụ</Label>
                <select
                  value={serviceCenter}
                  onChange={(e) => setServiceCenter(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                >
                  {serviceCenters.map((center) => (
                    <option key={center} value={center}>
                      {center}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleGenerateReport}>
                  Generate Report
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  Export to CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Preview Section */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview Section</CardTitle>
            <CardDescription>
              Kết quả báo cáo sẽ hiển thị ở đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-12 border-2 border-dashed border-border rounded-lg text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-muted-foreground">
                Báo cáo sẽ được hiển thị sau khi nhấn "Generate Report"
              </p>
              <div className="mt-6 h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Biểu đồ mock sẽ được hiển thị ở đây
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder when no report selected */}
      {!selectedReport && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                Vui lòng chọn một loại báo cáo ở trên để bắt đầu
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
