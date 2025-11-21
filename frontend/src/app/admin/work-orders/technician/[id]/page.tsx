'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { technicianService } from '@/services/technician.service'
import { http } from '@/lib/api'
import type { ApiResp } from '@/types/common'

interface Part {
  PartID: number
  PartName: string
  StockQuantity: number
  UnitPrice: number
}

interface Service {
  ServiceID: number
  ServiceName: string
  StandardCost: number
}

export default function TechnicianWorkOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workOrderId = Number(params.id)

  const [workOrder, setWorkOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [updating, setUpdating] = useState(false)

  const [partsList, setPartsList] = useState<Part[]>([])
  const [newPart, setNewPart] = useState({ partId: '', quantity: '1', unitPrice: '' })
  const [addingPart, setAddingPart] = useState(false)

  const [servicesList, setServicesList] = useState<Service[]>([])
  const [newService, setNewService] = useState({ serviceId: '', quantity: '1', unitPrice: '' })
  const [addingService, setAddingService] = useState(false)
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null)

  useEffect(() => {
    if (workOrderId) {
      loadWorkOrder()
      loadParts()
      loadServices()
    }
  }, [workOrderId])

  const loadWorkOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await technicianService.getMyWorkOrder(workOrderId)
      if (res.success) {
        const wo = res.data
        setWorkOrder(wo)
        setDiagnosis((wo as any)?.Diagnosis || '')
      } else {
        setError(res.error?.message || 'Không thể tải thông tin công việc')
      }
    } catch (err: any) {
      console.error('Load work order error:', err)
      setError(err?.message || 'Lỗi khi tải thông tin công việc')
    } finally {
      setLoading(false)
    }
  }

  const loadParts = async () => {
    try {
      const res = await http.get<ApiResp<Part[]>>('/admin/inventory')
      if (res.success) {
        setPartsList(res.data || [])
      }
    } catch (err) {
      console.error('Load parts error:', err)
    }
  }

  const loadServices = async () => {
    try {
      const res = await http.get<ApiResp<any[]>>('/services')
      if (res.success && Array.isArray(res.data)) {
        const mapped: Service[] = res.data.map((s: any) => ({
          ServiceID: s.ServiceID || s.id,
          ServiceName: s.ServiceName || s.serviceName || s.name || `Service #${s.ServiceID || s.id}`,
          StandardCost:
            s.StandardCost ??
            s.standardCost ??
            s.DefaultPrice ??
            s.Price ??
            s.cost ??
            0,
        }))
        setServicesList(mapped.sort((a, b) => a.ServiceName.localeCompare(b.ServiceName)))
      }
    } catch (err) {
      console.error('Load services error:', err)
    }
  }

  const handleStartWork = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn bắt đầu công việc này?')) return

    try {
      setUpdating(true)
      const res = await technicianService.startWork(workOrderId)
      if (res.success) {
        await loadWorkOrder()
        alert('Đã bắt đầu công việc')
      } else {
        alert(res.error?.message || 'Không thể bắt đầu công việc')
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi bắt đầu công việc')
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteWork = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn thành công việc này?')) return

    try {
      setUpdating(true)
      const res = await technicianService.completeWork(workOrderId)
      if (res.success) {
        await loadWorkOrder()
        alert('Đã hoàn thành công việc')
        router.push('/admin/work-orders/technician')
      } else {
        alert(res.error?.message || 'Không thể hoàn thành công việc')
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi hoàn thành công việc')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateDiagnosis = async () => {
    try {
      setUpdating(true)
      const res = await technicianService.updateDiagnosis(workOrderId, diagnosis)
      if (res.success) {
        await loadWorkOrder()
        alert('Đã cập nhật chẩn đoán')
      } else {
        alert(res.error?.message || 'Không thể cập nhật chẩn đoán')
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi cập nhật chẩn đoán')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddPart = async () => {
    const partId = Number(newPart.partId)
    const quantity = Number(newPart.quantity)

    if (!partId || !quantity || quantity <= 0) {
      alert('Vui lòng chọn phụ tùng và nhập số lượng hợp lệ')
      return
    }

    try {
      setAddingPart(true)
      const selectedPart = partsList.find((p) => p.PartID === partId)
      const unitPrice = newPart.unitPrice
        ? Number(newPart.unitPrice)
        : selectedPart?.UnitPrice

      const res = await technicianService.addPartUsage(workOrderId, {
        partId,
        quantity,
        unitPrice,
      })

      if (res.success) {
        await loadWorkOrder()
        setNewPart({ partId: '', quantity: '1', unitPrice: '' })
        alert('Đã thêm phụ tùng')
      } else {
        alert(res.error?.message || 'Không thể thêm phụ tùng')
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi thêm phụ tùng')
    } finally {
      setAddingPart(false)
    }
  }

  const handleAddService = async () => {
    const serviceId = Number(newService.serviceId)
    const quantity = Number(newService.quantity)

    if (!serviceId || !quantity || quantity <= 0) {
      alert('Vui lòng chọn dịch vụ và nhập số lượng hợp lệ')
      return
    }

    try {
      setAddingService(true)
      const selectedService = servicesList.find((s) => s.ServiceID === serviceId)
      let unitPrice = newService.unitPrice
        ? Number(newService.unitPrice)
        : selectedService?.StandardCost

      if (!unitPrice || Number.isNaN(unitPrice)) {
        alert('Không tìm thấy đơn giá cho dịch vụ này, vui lòng nhập đơn giá')
        setAddingService(false)
        return
      }

      const res = await http.post<ApiResp<any>>(
        `/workorders/${workOrderId}/details`,
        {
          serviceId,
          quantity,
          unitPrice,
        },
      )

      if (res.success) {
        await loadWorkOrder()
        setNewService({ serviceId: '', quantity: '1', unitPrice: '' })
        alert('Đã thêm dịch vụ')
      } else {
        alert(res.error?.message || 'Không thể thêm dịch vụ')
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi thêm dịch vụ')
    } finally {
      setAddingService(false)
    }
  }

  const handleDeleteService = async (detailId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này khỏi Work Order?')) return

    try {
      setDeletingServiceId(detailId)
      const res = await http.del<ApiResp<any>>(`/workorders/details/${detailId}`)
      if (res.success) {
        await loadWorkOrder()
        alert('Đã xóa dịch vụ khỏi Work Order')
      } else {
        alert(res.error?.message || 'Không thể xóa dịch vụ')
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa dịch vụ')
    } finally {
      setDeletingServiceId(null)
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '—'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount))
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('vi-VN')
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      Pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      InProgress: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
      OnHold: { label: 'Tạm dừng', className: 'bg-orange-100 text-orange-800' },
      Completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
    }
    const s =
      statusMap[status || ''] || {
        label: status || '—',
        className: 'bg-gray-100 text-gray-800',
      }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.className}`}>
        {s.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông tin công việc...</p>
        </div>
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Không tìm thấy công việc'}</p>
            <Button onClick={() => router.push('/admin/work-orders/technician')}>
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const raw = workOrder
  const wo = raw.workOrder || raw.WorkOrder || raw

  const services =
    raw.services ||
    raw.ServiceDetails ||
    raw.details ||
    []

  const parts =
    raw.parts ||
    raw.Parts ||
    raw.PartUsages ||
    []

  const totalService = services.reduce((sum: number, svc: any) => {
    const qty = svc.Quantity || 1
    const unit = svc.UnitPrice || 0
    const sub =
      svc.SubTotal != null
        ? Number(svc.SubTotal)
        : qty * unit
    return sum + sub
  }, 0)

  const totalParts = parts.reduce((sum: number, part: any) => {
    const qty = part.Quantity || 1
    const unit = part.UnitPrice || 0
    const sub =
      part.SubTotal != null
        ? Number(part.SubTotal)
        : qty * unit
    return sum + sub
  }, 0)

  const grandTotal = totalService + totalParts

  const status: string = wo.ProgressStatus || wo.Status || ''
  const isCompleted = status === 'Completed' || status === 'Done'

  const startTime = wo.StartTime || wo.StartedAt || wo.CreatedAt
  const endTime = wo.EndTime || wo.CompletedAt
  const estimated = wo.EstimatedCompletionTime

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Công việc #{wo.WorkOrderID}
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            {getStatusBadge(status)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/work-orders/technician')}
        >
          ← Quay lại
        </Button>
      </div>

      {/* Thông tin khách hàng và xe */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin khách hàng</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Khách hàng</Label>
            <p className="font-medium">{wo.CustomerName || '—'}</p>
            <p className="text-sm text-muted-foreground">{wo.CustomerPhone || '—'}</p>
          </div>
          <div>
            <Label>Biển số</Label>
            <p className="font-medium">{wo.LicensePlate || '—'}</p>
            <p className="text-sm text-muted-foreground">VIN: {wo.VIN || '—'}</p>
          </div>
        </div>
      </Card>

      {/* Dịch vụ */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Dịch vụ thực hiện</h2>
        {services.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dịch vụ</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((svc: any) => {
                const qty = svc.Quantity || 1
                const unit = svc.UnitPrice
                const sub =
                  svc.SubTotal != null
                    ? svc.SubTotal
                    : qty * (unit || 0)
                const detailId = svc.WorkOrderDetailID || svc.WorkOrderDetailId
                return (
                  <TableRow key={detailId || `${svc.ServiceID}-${svc.ServiceName}`}>
                    <TableCell>{svc.ServiceName || '—'}</TableCell>
                    <TableCell className="text-right">{qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(unit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sub)}</TableCell>
                    <TableCell className="text-right">
                      {detailId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isCompleted || deletingServiceId === detailId}
                          onClick={() => handleDeleteService(detailId)}
                        >
                          {deletingServiceId === detailId ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground mb-2">Chưa có dịch vụ nào</p>
        )}

        {/* Thêm dịch vụ */}
        <div className="border-t pt-4 space-y-3 mt-4">
          <h3 className="font-semibold">Thêm dịch vụ</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Dịch vụ</Label>
              <select
                value={newService.serviceId}
                onChange={(e) => {
                  const selectedId = e.target.value
                  const selected = servicesList.find(
                    (s) => s.ServiceID === Number(selectedId),
                  )
                  setNewService({
                    ...newService,
                    serviceId: selectedId,
                    unitPrice: selected && selected.StandardCost
                      ? String(selected.StandardCost)
                      : '',
                  })
                }}
                className="w-full p-2 border rounded-md"
                disabled={isCompleted}
              >
                <option value="">Chọn dịch vụ</option>
                {servicesList.map((s) => (
                  <option key={s.ServiceID} value={s.ServiceID}>
                    {s.ServiceName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Số lượng</Label>
              <Input
                type="number"
                min="1"
                value={newService.quantity}
                onChange={(e) =>
                  setNewService({ ...newService, quantity: e.target.value })
                }
                placeholder="1"
                disabled={isCompleted}
              />
            </div>
            <div>
              <Label>Đơn giá</Label>
              <Input
                type="number"
                value={newService.unitPrice}
                onChange={(e) =>
                  setNewService({ ...newService, unitPrice: e.target.value })
                }
                placeholder="Tự động điền khi chọn dịch vụ"
                disabled={isCompleted}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddService}
                disabled={addingService || isCompleted}
                className="w-full"
              >
                {addingService ? 'Đang thêm...' : 'Thêm dịch vụ'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Chẩn đoán */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Chẩn đoán</h2>
        <div className="space-y-3">
          <div>
            <Label>Ghi chẩn đoán</Label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Nhập chẩn đoán lỗi..."
              className="w-full min-h-[100px] p-3 border rounded-md"
              disabled={isCompleted}
            />
          </div>
          <Button onClick={handleUpdateDiagnosis} disabled={updating || isCompleted}>
            {updating ? 'Đang cập nhật...' : 'Cập nhật chẩn đoán'}
          </Button>
        </div>
      </Card>

      {/* Phụ tùng đã sử dụng */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Phụ tùng đã sử dụng</h2>
        {parts.length > 0 ? (
          <Table className="mb-4">
            <TableHeader>
              <TableRow>
                <TableHead>Phụ tùng</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part: any) => {
                const qty = part.Quantity || 1
                const unit = part.UnitPrice
                const sub =
                  part.SubTotal != null
                    ? part.SubTotal
                    : qty * (unit || 0)
                return (
                  <TableRow key={part.UsageID || `${part.PartID}-${part.PartName}`}>
                    <TableCell>{part.PartName || '—'}</TableCell>
                    <TableCell className="text-right">{qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(unit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sub)}</TableCell>
                    <TableCell className="text-right">
                      {part.UsageID ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const ok = window.confirm('Bạn có chắc chắn muốn xóa phụ tùng này khỏi work order?\n(Phục hồi lại tồn kho)')
                            if (!ok) return
                            try {
                              setAddingPart(true)
                              const res = await technicianService.deletePartUsage(part.UsageID)
                              if (res.success) {
                                await loadWorkOrder()
                                alert('Đã xóa phụ tùng và phục hồi tồn kho')
                              } else {
                                alert(res.error?.message || 'Không thể xóa phụ tùng')
                              }
                            } catch (err: any) {
                              alert(err?.message || 'Lỗi khi xóa phụ tùng')
                            } finally {
                              setAddingPart(false)
                            }
                          }}
                          disabled={isCompleted}
                        >
                          Xóa
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground mb-4">Chưa có phụ tùng nào</p>
        )}

        {/* Thêm phụ tùng */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-semibold">Thêm phụ tùng</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Phụ tùng</Label>
              <select
                value={newPart.partId}
                onChange={(e) => {
                  const selectedPartId = e.target.value
                  const selectedPart = partsList.find(
                    (p) => p.PartID === Number(selectedPartId),
                  )
                  setNewPart({
                    ...newPart,
                    partId: selectedPartId,
                    unitPrice: selectedPart?.UnitPrice
                      ? String(selectedPart.UnitPrice)
                      : '',
                  })
                }}
                className="w-full p-2 border rounded-md"
                disabled={isCompleted}
              >
                <option value="">Chọn phụ tùng</option>
                {partsList.map((p) => (
                  <option key={p.PartID} value={p.PartID}>
                    {p.PartName} (Tồn: {p.StockQuantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Số lượng</Label>
              <Input
                type="number"
                min="1"
                value={newPart.quantity}
                onChange={(e) =>
                  setNewPart({ ...newPart, quantity: e.target.value })
                }
                placeholder="1"
                disabled={isCompleted}
              />
            </div>
            <div>
              <Label>Đơn giá</Label>
              <Input
                type="number"
                value={newPart.unitPrice}
                onChange={(e) =>
                  setNewPart({ ...newPart, unitPrice: e.target.value })
                }
                placeholder="Tự động điền khi chọn phụ tùng"
                disabled={isCompleted}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddPart}
                disabled={addingPart || isCompleted}
                className="w-full"
              >
                {addingPart ? 'Đang thêm...' : 'Thêm phụ tùng'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Thông tin thời gian */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin thời gian</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Thời gian bắt đầu</Label>
            <p>{formatDate(startTime)}</p>
          </div>
          <div>
            <Label>Thời gian kết thúc</Label>
            <p>{formatDate(endTime)}</p>
          </div>
          <div>
            <Label>Hạn hoàn thành dự kiến</Label>
            <p>{formatDate(estimated)}</p>
          </div>
        </div>
      </Card>

      {/* Tổng chi phí */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Tổng chi phí</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Tổng dịch vụ</span>
            <span className="font-medium">{formatCurrency(totalService)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tổng phụ tùng</span>
            <span className="font-medium">{formatCurrency(totalParts)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Tạm tính (dịch vụ + phụ tùng)</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          {wo.TotalAmount != null && (
            <p className="text-xs text-muted-foreground mt-1">
              Số tiền trên hệ thống (TotalAmount): {formatCurrency(wo.TotalAmount)} – sẽ
              chính thức khi nhân viên xuất hóa đơn.
            </p>
          )}
        </div>
      </Card>

      {/* Nút action */}
      {!isCompleted && (
        <Card className="p-6">
          <div className="flex gap-3">
            {status === 'Pending' && (
              <Button
                onClick={handleStartWork}
                disabled={updating}
                className="flex-1"
              >
                {updating ? 'Đang xử lý...' : '▶ Bắt đầu công việc'}
              </Button>
            )}
            {status === 'InProgress' && (
              <Button
                onClick={handleCompleteWork}
                disabled={updating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updating ? 'Đang xử lý...' : '✓ Hoàn thành công việc'}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
