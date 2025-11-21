'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { technicianService } from '@/services/technician.service'
import type { WorkOrder } from '@/types/workorder'

export default function TechnicianWorkOrdersPage() {
  const router = useRouter()

  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>([])
  const [completedWorkOrders, setCompletedWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkOrders()
  }, [])

  const loadWorkOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load cả active & completed
      const [activeRes, completedRes] = await Promise.all([
        technicianService.getMyActiveWorkOrders(),
        technicianService.getMyCompletedWorkOrders(),
      ])

      if (activeRes.success) {
        setActiveWorkOrders(activeRes.data || [])
      } else {
        setError(activeRes.error?.message || 'Không thể tải danh sách công việc')
      }

      if (completedRes.success) {
        setCompletedWorkOrders(completedRes.data || [])
      } else if (!error) {
        // nếu chưa có error, thì dùng error bên completed
        setError(completedRes.error?.message || null)
      }
    } catch (err: any) {
      console.error('Load work orders error:', err)
      setError(err?.message || 'Lỗi khi tải danh sách công việc')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('vi-VN')
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      Pending:    { label: 'Chờ xử lý',   className: 'bg-yellow-100 text-yellow-800' },
      InProgress: { label: 'Đang xử lý',  className: 'bg-blue-100 text-blue-800' },
      OnHold:     { label: 'Tạm dừng',    className: 'bg-orange-100 text-orange-800' },
      Completed:  { label: 'Hoàn thành',  className: 'bg-green-100 text-green-800' },
    }

    const s = statusMap[status || ''] || {
      label: status || '—',
      className: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>
        {s.label}
      </span>
    )
  }

  const handleViewDetail = (workOrderId: number) => {
    // Route chi tiết của kỹ thuật: /admin/work-orders/technician/[id]
    router.push(`/admin/work-orders/technician/${workOrderId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải danh sách công việc...</p>
        </div>
      </div>
    )
  }

  if (error && activeWorkOrders.length === 0 && completedWorkOrders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadWorkOrders}>Thử lại</Button>
          </div>
        </Card>
      </div>
    )
  }

  const hasActive = activeWorkOrders.length > 0
  const hasCompleted = completedWorkOrders.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Công việc của tôi</h1>
        <p className="text-muted-foreground mt-2">
          Danh sách các lệnh sửa chữa được gán cho bạn và lịch sử hoàn thành
        </p>
      </div>

      {!hasActive && !hasCompleted ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Bạn chưa có công việc nào được gán.</p>
        </Card>
      ) : (
        <>
          {/* Công việc đang xử lý */}
          {hasActive && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Công việc hiện tại</h2>
                <Button size="sm" variant="outline" onClick={loadWorkOrders}>
                  Tải lại
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã WO</TableHead>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>Biển số</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cập nhật lúc</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeWorkOrders.map((wo) => {
                    const anyWo = wo as any
                    const status = anyWo.ProgressStatus || anyWo.Status
                    const updatedAt = anyWo.UpdatedAt || anyWo.StartTime
                    return (
                      <TableRow key={wo.WorkOrderID}>
                        <TableCell className="font-medium">#{wo.WorkOrderID}</TableCell>
                        <TableCell>{anyWo.ServiceName || '—'}</TableCell>
                        <TableCell>{anyWo.LicensePlate || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{anyWo.CustomerName || '—'}</span>
                            <span className="text-xs text-muted-foreground">
                              {anyWo.CustomerPhone || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell>{formatDateTime(updatedAt)}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleViewDetail(wo.WorkOrderID)}>
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Lịch sử hoàn thành */}
          {hasCompleted && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Lịch sử hoàn thành</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã WO</TableHead>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>Biển số</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Hoàn thành lúc</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedWorkOrders.map((wo) => {
                    const anyWo = wo as any
                    const completedAt = anyWo.CompletedAt || anyWo.UpdatedAt
                    return (
                      <TableRow key={wo.WorkOrderID}>
                        <TableCell className="font-medium">#{wo.WorkOrderID}</TableCell>
                        <TableCell>{anyWo.ServiceName || '—'}</TableCell>
                        <TableCell>{anyWo.LicensePlate || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{anyWo.CustomerName || '—'}</span>
                            <span className="text-xs text-muted-foreground">
                              {anyWo.CustomerPhone || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(completedAt)}</TableCell>
                        <TableCell>{formatCurrency(anyWo.TotalAmount)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(wo.WorkOrderID)}
                          >
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
