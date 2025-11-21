'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, useModalEscape } from '@/components/ui/modal'
import Label from '@/components/form/Label'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { adminService } from '@/services/admin.service'
import { http } from '@/lib/api'
import type { ApiResp } from '@/types/common'
import type { WorkOrder, Account } from '@/types/entities'

type StatusKey = 'Pending' | 'InProgress' | 'OnHold' | 'Completed'

const STATUS_LABELS: Record<StatusKey, string> = {
  Pending: 'Chờ xử lý',
  InProgress: 'Đang thực hiện',
  OnHold: 'Tạm dừng',
  Completed: 'Hoàn tất',
}

const STATUS_COLORS: Record<StatusKey, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  InProgress: 'bg-blue-100 text-blue-700',
  OnHold: 'bg-rose-100 text-rose-700',
  Completed: 'bg-emerald-100 text-emerald-700',
}

const STATUS_ORDER: StatusKey[] = ['Pending', 'InProgress', 'OnHold', 'Completed']
const NEXT_STATUS: Record<StatusKey, StatusKey> = {
  Pending: 'InProgress',
  InProgress: 'Completed',
  OnHold: 'InProgress',
  Completed: 'Completed',
}

const resolveStatus = (wo: WorkOrder): StatusKey => {
  const rawValue =
    (wo.ProgressStatus ||
      wo.Status ||
      (wo as any).ProgressStatus ||
      (wo as any).Status ||
      'Pending') as string
  const normalized = rawValue === 'Done' ? 'Completed' : rawValue
  return (STATUS_LABELS[normalized as StatusKey] ? normalized : 'Pending') as StatusKey
}

const toDateTimeInputValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const toISOStringOrNull = (value: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatCurrency = (value?: number | null) =>
  value != null
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
    : '—'

const isWorkOrderOverdue = (wo: WorkOrder): boolean => {
  const estimated =
    wo.EstimatedCompletionTime ??
    (wo as any).EstimatedCompletionTime ??
    (wo as any).estimatedCompletionTime ??
    null
  if (!estimated) return false
  const status = resolveStatus(wo)
  if (status === 'Completed') return false
  const value = new Date(estimated)
  if (Number.isNaN(value.getTime())) return false
  return value.getTime() < Date.now()
}

export default function WorkOrdersPage() {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [technicianIdInput, setTechnicianIdInput] = useState<string>('')
  const [statusInput, setStatusInput] = useState<StatusKey>('Pending')
  const [estimatedCompletionInput, setEstimatedCompletionInput] = useState<string>('')
  const [staffList, setStaffList] = useState<Array<{ AccountID: number; FullName: string; Role: string; activeWorkOrders: number }>>([])
  const [appointmentInfo, setAppointmentInfo] = useState<{ ScheduledDate?: string; StartTime?: string; EndTime?: string } | null>(null)
  const [diagnosisInput, setDiagnosisInput] = useState<string>('')
  const [totalAmountInput, setTotalAmountInput] = useState<string>('')
  const [serviceLines, setServiceLines] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [newServiceLine, setNewServiceLine] = useState({ serviceId: '', unitPrice: '' })
  const [addingService, setAddingService] = useState(false)
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null)
  const [servicesList, setServicesList] = useState<Array<{ ServiceID: number; ServiceName: string; StandardCost: number }>>([])
  const [submitting, setSubmitting] = useState(false)
  const detailInitRef = useRef(false)

  // Redirect Technician to their own page
  useEffect(() => {
    const user = getUser()
    const role = user?.Role
    if (role === 'Technician') {
      router.replace('/admin/work-orders/technician')
    }
  }, [router])

  const fetchWorkOrders = async (status?: string) => {
    try {
      setLoading(true)
      setError(null)
      const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''
      const res = await adminService.listWorkOrders(query)
      if (res.success) {
        setWorkOrders(res.data as WorkOrder[])
      } else {
        setError(res.error?.message || 'Không thể tải work orders')
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Không thể tải work orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const user = getUser()
    const role = user?.Role
    // Only fetch work orders if user is Admin or Staff
    if (role === 'Admin' || role === 'Staff') {
      fetchWorkOrders(statusFilter)
    }
  }, [statusFilter])

  // Load technician list for dropdown (only Technician role, prioritized by workload)
  useEffect(() => {
    const user = getUser()
    const role = user?.Role
    // Only load technicians if user is Admin or Staff
    if (role !== 'Admin' && role !== 'Staff') {
      return
    }

    const loadTechnicians = async () => {
      try {
        // Load technicians using dedicated endpoint
        const res = await http.get<ApiResp<Account[]>>('/account/technicians')
        if (res.success && Array.isArray(res.data)) {
          const technicians = res.data
            .map((acc: Account) => {
              const techId = acc.AccountID
              // Count active work orders for this technician
              const activeWorkOrders = workOrders.filter((wo) => {
                const woTechId = wo.TechnicianID ?? (wo as any).TechnicianID
                const status = resolveStatus(wo)
                return woTechId === techId && status !== 'Completed'
              }).length
              
              return {
                AccountID: techId,
                FullName: acc.FullName || acc.Username || `ID ${techId}`,
                Role: acc.Role,
                activeWorkOrders,
              }
            })
            // Sort: technicians with 0 work orders first, then by name
            .sort((a: { activeWorkOrders: number; FullName: string }, b: { activeWorkOrders: number; FullName: string }) => {
              if (a.activeWorkOrders === 0 && b.activeWorkOrders > 0) return -1
              if (a.activeWorkOrders > 0 && b.activeWorkOrders === 0) return 1
              return a.FullName.localeCompare(b.FullName)
            })
          setStaffList(technicians)
        }
      } catch (e) {
        console.error('Failed to load technicians:', e)
      }
    }
    loadTechnicians()
  }, [workOrders])

  // Load services list for dropdown
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await adminService.listServices()
        if (res.success && Array.isArray(res.data)) {
          const services = res.data.map((s: any) => ({
            ServiceID: s.ServiceID || s.id,
            ServiceName: s.ServiceName || s.serviceName || s.name || `Service #${s.ServiceID || s.id}`,
            StandardCost: s.StandardCost || s.standardCost || s.cost || 0,
          })).sort((a, b) => a.ServiceName.localeCompare(b.ServiceName))
          setServicesList(services)
        }
      } catch (e) {
        console.error('Failed to load services:', e)
      }
    }
    loadServices()
  }, [])

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    const toSortableTime = (wo: WorkOrder) => {
      const raw =
        (wo as any).UpdatedAt ??
        (wo as any).CreatedAt ??
        (wo as any).StartTime ??
        wo.StartTime ??
        null
      const date = raw ? new Date(raw) : null
      return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
    }

    return [...workOrders]
      .filter((wo) => {
        const technician = (wo.technicianName ?? (wo as any).TechnicianName ?? '').toLowerCase()
        const matchesSearch =
          !keyword ||
          String(wo.WorkOrderID).includes(keyword) ||
          (wo.vin ?? (wo as any).VIN ?? '').toLowerCase().includes(keyword) ||
          (wo.licensePlate ?? (wo as any).LicensePlate ?? '').toLowerCase().includes(keyword) ||
          technician.includes(keyword)
        return matchesSearch
      })
      .sort((a, b) => {
        const orderA = STATUS_ORDER.indexOf(resolveStatus(a))
        const orderB = STATUS_ORDER.indexOf(resolveStatus(b))
        if (orderA !== orderB) return orderA - orderB
        return toSortableTime(b) - toSortableTime(a)
      })
  }, [workOrders, searchTerm])

  const statusSummary = useMemo(() => {
    return workOrders.reduce<Record<StatusKey, number>>((acc, wo) => {
      const key = resolveStatus(wo)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, { Pending: 0, InProgress: 0, OnHold: 0, Completed: 0 })
  }, [workOrders])

  const overdueCount = useMemo(
    () => workOrders.filter((wo) => isWorkOrderOverdue(wo)).length,
    [workOrders]
  )

  const technicianSummary = useMemo(() => {
    const map = new Map<number, { name: string; count: number }>()
    workOrders.forEach((wo) => {
      const status = resolveStatus(wo)
      if (status === 'Completed') return
      const technicianId = wo.TechnicianID ?? (wo as any).TechnicianID
      if (!technicianId) return
      const id = Number(technicianId)
      const name = wo.technicianName || (wo as any).TechnicianName || `ID ${id}`
      const current = map.get(id) || { name, count: 0 }
      current.name = name
      current.count += 1
      map.set(id, current)
    })
    return Array.from(map.entries())
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.count - a.count)
  }, [workOrders])

  const openEditModal = async (order: WorkOrder) => {
    const statusKey = resolveStatus(order)
    setSelectedOrder(order)
    setTechnicianIdInput(order.TechnicianID ? String(order.TechnicianID) : '')
    setStatusInput(statusKey)
    setEstimatedCompletionInput(
      toDateTimeInputValue(
        order.EstimatedCompletionTime ??
          (order as any).EstimatedCompletionTime ??
          (order as any).estimatedCompletionTime ??
          null
      )
    )
    setDiagnosisInput(order.Diagnosis ?? (order as any).Diagnosis ?? '')
    const totalRaw = order.TotalAmount ?? (order as any).TotalAmount ?? null
    setTotalAmountInput(totalRaw != null ? String(totalRaw) : '')
    setServiceLines([])
    setNewServiceLine({ serviceId: '', unitPrice: '' })
    setDetailError(null)
    detailInitRef.current = false
    
    // Load appointment info for scheduled date/time
    if (order.AppointmentID) {
      try {
        const apptRes = await adminService.listAppointments('')
        if (apptRes.success && Array.isArray(apptRes.data)) {
          const appt = apptRes.data.find((a: any) => 
            (a.AppointmentID || a.id) === order.AppointmentID
          ) as any
          if (appt) {
            setAppointmentInfo({
              ScheduledDate: appt.ScheduledDate || appt.scheduledDate,
              StartTime: appt.StartTime || appt.slotStart,
              EndTime: appt.EndTime || appt.slotEnd,
            })
          } else {
            setAppointmentInfo(null)
          }
        }
      } catch (e) {
        console.error('Failed to load appointment:', e)
        setAppointmentInfo(null)
      }
    } else {
      setAppointmentInfo(null)
    }
    
    setModalOpen(true)
  }

  const buildUpdatePayload = (override?: Record<string, unknown>) => {
    const base: Record<string, unknown> = {}
    const currentStatus = selectedOrder ? resolveStatus(selectedOrder) : 'Pending'
    const canAssign = currentStatus === 'Pending' || currentStatus === 'InProgress'
    
    // Only allow technician assignment when status is Pending or InProgress
    if (canAssign && technicianIdInput) {
      base.TechnicianID = Number(technicianIdInput)
    }
    // Allow status update (map Completed -> Done for API) - backend expects ProgressStatus
    if (statusInput) {
      base.ProgressStatus = statusInput === 'Completed' ? 'Done' : statusInput
    }
    // StartTime and EndTime will be set from appointment automatically
    base.EstimatedCompletionTime = toISOStringOrNull(estimatedCompletionInput)
    // Only include Diagnosis when a non-empty value is provided to avoid accidentally clearing it
    if (typeof diagnosisInput === 'string' && diagnosisInput.trim() !== '') {
      base.Diagnosis = diagnosisInput
    }
    if (totalAmountInput) base.TotalAmount = Number(totalAmountInput)
    if (override) Object.assign(base, override)
    if (base.ProgressStatus === 'Completed') {
      base.ProgressStatus = 'Done'
    }
    Object.keys(base).forEach((key) => {
      if (base[key] === undefined) delete base[key]
    })
    return base
  }

  const submitWorkOrderUpdate = async (
    override?: Record<string, unknown>,
    options: { closeModal?: boolean } = { closeModal: true }
  ) => {
    if (!selectedOrder) return
    try {
      setSubmitting(true)
      const res = await adminService.updateWorkOrder(
        selectedOrder.WorkOrderID,
        buildUpdatePayload(override)
      )
      if (!res.success) {
        setError(res.error?.message || 'Không thể cập nhật work order')
      } else {
        await fetchWorkOrders(statusFilter)
        if (options.closeModal !== false) {
          setModalOpen(false)
        }
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Không thể cập nhật work order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    await submitWorkOrderUpdate()
  }

  const loadWorkOrderDetail = useCallback(
    async (workOrderId: number) => {
      try {
        setDetailLoading(true)
        setDetailError(null)
        const res = await adminService.getWorkOrder(workOrderId)
        if (!res.success) {
          setDetailError(res.error?.message || 'Không thể tải chi tiết work order')
          setServiceLines([])
          return
        }
        const data = res.data || {}
        const header = data.workOrder || data

          if (header && typeof header === 'object') {
          setSelectedOrder((prev) =>
            prev && prev.WorkOrderID === workOrderId ? { ...prev, ...header } : prev
          )
          if (!detailInitRef.current) {
              if (header.TechnicianID != null) {
                setTechnicianIdInput(String(header.TechnicianID))
              }
            setStatusInput(resolveStatus(header))
            setEstimatedCompletionInput(
              toDateTimeInputValue(
                header.EstimatedCompletionTime ??
                  header.estimatedCompletionTime ??
                  null
              )
            )
            setDiagnosisInput(header.Diagnosis ?? header.diagnosis ?? '')
            const totalRaw = header.TotalAmount ?? header.totalAmount ?? null
            setTotalAmountInput(totalRaw != null ? String(totalRaw) : '')
            detailInitRef.current = true
          }
        }

        setServiceLines(data.services || [])
      } catch (err: any) {
        setDetailError(err?.message || 'Không thể tải chi tiết work order')
        setServiceLines([])
      } finally {
        setDetailLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!modalOpen || !selectedOrder) return
    loadWorkOrderDetail(selectedOrder.WorkOrderID)
  }, [modalOpen, selectedOrder?.WorkOrderID, loadWorkOrderDetail])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      if (!technicianIdInput || !selectedOrder?.AppointmentID) {
        setError('Cần chọn kỹ thuật viên và appointment')
        return
      }
      const payload = {
        appointmentId: selectedOrder.AppointmentID,
        technicianId: Number(technicianIdInput),
        // startTime and endTime will be set from appointment automatically
        estimatedCompletionTime: toISOStringOrNull(estimatedCompletionInput),
        diagnosis: diagnosisInput || undefined,
      }
      const res = await adminService.createWorkOrder(payload)
      if (!res.success) {
        setError(res.error?.message || 'Không thể tạo work order')
      } else {
        await fetchWorkOrders(statusFilter)
        setModalOpen(false)
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Không thể tạo work order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddServiceLine = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault?.()
    if (!selectedOrder) return
    try {
      setAddingService(true)
      setDetailError(null)
      
      const serviceId = Number(newServiceLine.serviceId)
      if (!serviceId || Number.isNaN(serviceId)) {
        setDetailError('Cần chọn dịch vụ hợp lệ')
        return
      }
      
      // Get unitPrice from selected service if not provided
      let unitPrice = newServiceLine.unitPrice ? Number(newServiceLine.unitPrice) : undefined
      if (!unitPrice || Number.isNaN(unitPrice)) {
        const selectedService = servicesList.find(s => s.ServiceID === serviceId)
        if (selectedService && selectedService.StandardCost > 0) {
          unitPrice = selectedService.StandardCost
        }
      }
      
      const payload = {
        serviceId,
        quantity: 1, // Always 1, no quantity field
        unitPrice: unitPrice,
      }
      
      const res = await adminService.addWorkOrderDetail(selectedOrder.WorkOrderID, payload)
      if (!res.success) {
        const errorMsg = res.error?.message || (res as any).message || 'Không thể thêm dịch vụ'
        setDetailError(errorMsg)
        console.error('Add service detail error:', res)
        return
      }
      
      // Reload work order detail to get updated service lines
      await loadWorkOrderDetail(selectedOrder.WorkOrderID)
      setNewServiceLine({ serviceId: '', unitPrice: '' })
      await fetchWorkOrders(statusFilter)
    } catch (err: any) {
      console.error('Add service detail exception:', err)
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Không thể thêm dịch vụ'
      setDetailError(errorMsg)
    } finally {
      setAddingService(false)
    }
  }

  const handleDeleteServiceLine = async (detailId: number) => {
    if (!selectedOrder) return
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')
    if (!confirmed) return
    
    try {
      setDeletingServiceId(detailId)
      setDetailError(null)
      
      const res = await adminService.deleteWorkOrderDetail(detailId)
      if (!res.success) {
        const errorMsg = res.error?.message || (res as any).message || 'Không thể xóa dịch vụ'
        setDetailError(errorMsg)
        console.error('Delete service detail error:', res)
        return
      }
      
      // Reload work order detail to get updated service lines
      await loadWorkOrderDetail(selectedOrder.WorkOrderID)
      await fetchWorkOrders(statusFilter)
    } catch (err: any) {
      console.error('Delete service detail exception:', err)
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Không thể xóa dịch vụ'
      setDetailError(errorMsg)
    } finally {
      setDeletingServiceId(null)
    }
  }

  const handleSaveAndAdvance = async () => {
    const next = NEXT_STATUS[statusInput]
    // Ensure we send the backend-expected field name
    await submitWorkOrderUpdate({ ProgressStatus: next }, { closeModal: false })
    setStatusInput(next)
  }

  const handleGoToPayment = () => {
    if (!selectedOrder) return
    setModalOpen(false)
    router.push(`/admin/reports/financial?workOrderId=${selectedOrder.WorkOrderID}`)
  }

  // Allow closing modal with Escape key when open (helps if overlay covers UI)
  useModalEscape(() => setModalOpen(false), modalOpen)

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground mt-2">
          Theo dõi và phân công công việc cho đội kỹ thuật, giám sát tiến độ sửa chữa.
          </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Tổng quan trạng thái</CardTitle>
            <CardDescription>
              Phân bổ work order theo trạng thái hiện tại. Quá hạn sẽ được ưu tiên xử lý.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {STATUS_ORDER.map((status) => (
                <div
                  key={status}
                  className="rounded-lg border border-border/60 bg-muted/10 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {STATUS_LABELS[status]}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {statusSummary[status] ?? 0}
          </p>
        </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {overdueCount > 0 ? (
                <span className="text-amber-600 font-medium">
                  Có {overdueCount} work order đang quá hạn cần xử lý.
                </span>
              ) : (
                'Không có work order quá hạn.'
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Phân công kỹ thuật viên</CardTitle>
            <CardDescription>
              Số lượng work order đang phụ trách bởi từng kỹ thuật viên (chưa hoàn tất).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {technicianSummary.length ? (
              <ul className="space-y-3">
                {technicianSummary.map((item, _idx) => (
                  <li key={`${item.id ?? 'tech'}-${_idx}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {item.name}{' '}
                      <span className="text-muted-foreground font-normal">(ID: {item.id})</span>
                    </span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có kỹ thuật viên nào được phân công.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
              <Input
              placeholder="Tìm theo ID, VIN, biển số hoặc kỹ thuật viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="All">Tất cả trạng thái</option>
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
              </select>
            <div className="text-sm text-muted-foreground flex items-center">
              Tổng số: <span className="ml-2 font-medium text-foreground">{filteredOrders.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phiếu công việc</CardTitle>
          <CardDescription>Thông tin work order đang hoạt động và đã hoàn tất.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Xe</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Kỹ thuật viên</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Hạn hoàn thành</TableHead>
                  <TableHead>Chẩn đoán & Phụ tùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      Không có work order nào phù hợp.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredOrders.map((wo, _idx) => {
                    const statusKey = resolveStatus(wo)
                    const serviceLabel = wo.serviceName || (wo as any).ServiceName || '—'
                    const technicianName =
                      wo.technicianName || (wo as any).TechnicianName || 'Chưa phân công'
                    const technicianIdValue =
                      wo.TechnicianID ?? (wo as any).TechnicianID ?? '—'
                    const startTime = wo.StartTime ?? (wo as any).StartTime ?? null
                    const endTime = wo.EndTime ?? (wo as any).EndTime ?? null
                    const estimated =
                      wo.EstimatedCompletionTime ??
                      (wo as any).EstimatedCompletionTime ??
                      (wo as any).estimatedCompletionTime ??
                      null
                    const diagnosis = wo.Diagnosis ?? (wo as any).Diagnosis ?? ''
                    const partsSummary =
                      wo.PartsSummary ?? (wo as any).PartsSummary ?? (wo as any).partsSummary ?? ''
                    const partsTotal =
                      wo.PartsTotal ?? (wo as any).PartsTotal ?? (wo as any).partsTotal ?? null
                    const totalAmount = wo.TotalAmount ?? (wo as any).TotalAmount ?? null
                    const overdue = isWorkOrderOverdue(wo)
                    return (
                      <TableRow key={`${wo.WorkOrderID ?? 'wo'}-${_idx}`}>
                        <TableCell className="font-medium">#{wo.WorkOrderID}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">APT #{wo.AppointmentID ?? '—'}</span>
                            <span className="text-xs text-muted-foreground">
                              {wo.customerName || (wo as any).CustomerName || ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {wo.licensePlate || (wo as any).LicensePlate || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {wo.vin || (wo as any).VIN || ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{serviceLabel}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{technicianName}</span>
                            <span className="text-xs text-muted-foreground">ID: {technicianIdValue}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>Bắt đầu: {formatDateTime(startTime)}</span>
                            <span>Kết thúc: {formatDateTime(endTime)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span>{formatDateTime(estimated)}</span>
                              {overdue && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                  Quá hạn
                                </span>
                              )}
                            </div>
                            {partsTotal != null && (
                              <span className="text-xs text-muted-foreground">
                                Chi phí phụ tùng: {formatCurrency(partsTotal)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {diagnosis ? (
                            <p>{diagnosis}</p>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {partsSummary && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Phụ tùng: {partsSummary}
                            </p>
                          )}
                        </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                            {STATUS_LABELS[statusKey]}
                      </span>
                    </TableCell>
                        <TableCell className="text-sm">{formatCurrency(totalAmount)}</TableCell>
                    
                    <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(wo)}>
                            Cập nhật
                      </Button>
                    </TableCell>
                  </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-lg m-4">
        <form
          onSubmit={selectedOrder?.WorkOrderID ? handleUpdate : handleCreate}
          className="flex h-full max-h-[80vh] flex-col gap-6 p-6"
        >
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {selectedOrder?.WorkOrderID ? 'Cập nhật Work Order' : 'Tạo Work Order mới'}
          </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chọn kỹ thuật viên để phân công công việc.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {(() => {
                const currentStatus = selectedOrder ? resolveStatus(selectedOrder) : 'Pending'
                const canAssign = currentStatus === 'Pending' || currentStatus === 'InProgress'
                
                if (!canAssign) {
                  return (
                    <div className="rounded-md border border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 p-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        ⚠️ Work Order này đang ở trạng thái <strong>{STATUS_LABELS[currentStatus]}</strong>. 
                        Chỉ có thể phân công kỹ thuật viên khi trạng thái là <strong>Chờ xử lý</strong> hoặc <strong>Đang thực hiện</strong>.
                      </p>
                    </div>
                  )
                }
                
                return (
                  <div>
                    <Label>Kỹ thuật viên</Label>
                    <select
                      value={technicianIdInput}
                      onChange={(e) => setTechnicianIdInput(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">-- Chọn kỹ thuật viên --</option>
                      {staffList.map((tech) => (
                        <option key={tech.AccountID} value={tech.AccountID}>
                          {tech.FullName}
                          {tech.activeWorkOrders === 0 
                            ? ' (Sẵn sàng)' 
                            : ` (${tech.activeWorkOrders} công việc đang xử lý)`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chỉ có thể phân công khi trạng thái là <strong>Chờ xử lý</strong> hoặc <strong>Đang thực hiện</strong>.
                    </p>
                  </div>
                )
              })()}
              
              <div>
                <Label>Trạng thái</Label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as StatusKey)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Appointment time info (read-only) */}
              {appointmentInfo && (
                <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Thông tin đặt lịch (từ Appointment)</Label>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">Ngày hẹn: </span>
                      <span className="font-medium">
                        {appointmentInfo.ScheduledDate 
                          ? formatDateTime(appointmentInfo.ScheduledDate)
                          : '—'}
                      </span>
                    </div>
                    {(appointmentInfo.StartTime || appointmentInfo.EndTime) && (
                      <div>
                        <span className="text-muted-foreground">Thời gian: </span>
                        <span className="font-medium">
                          {appointmentInfo.StartTime ? formatDateTime(appointmentInfo.StartTime) : '—'}
                          {' - '}
                          {appointmentInfo.EndTime ? formatDateTime(appointmentInfo.EndTime) : '—'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <Label>Hạn hoàn thành dự kiến</Label>
                <Input
                  type="datetime-local"
                  value={estimatedCompletionInput}
                  onChange={(e) => setEstimatedCompletionInput(e.target.value)}
                />
              </div>
              <div>
                <Label>Tổng chi phí (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  step="1000"
                  value={totalAmountInput}
                  onChange={(e) => setTotalAmountInput(e.target.value)}
                  placeholder="Tự động nếu có chi tiết dịch vụ/phụ tùng"
                />
              </div>
              <div>
              <Label>Chẩn đoán / Ghi chú</Label>
              <textarea
                value={diagnosisInput}
                onChange={(e) => setDiagnosisInput(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Nhập chẩn đoán kỹ thuật viên hoặc ghi chú thêm"
              />
            </div>
            {detailError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {detailError}
              </div>
            )}
            <div className="space-y-3 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  DỊCH VỤ ĐÃ GIAO
                </h3>
                {detailLoading && (
                  <span className="text-xs text-muted-foreground">Đang tải chi tiết...</span>
                )}
              </div>
              {serviceLines.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dịch vụ</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Thành tiền</TableHead>
                      <TableHead className="w-[80px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceLines.map((line: any, _sidx: number) => (
                      <TableRow key={`${line.WorkOrderDetailID ?? 'line'}-${_sidx}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{line.ServiceName}</span>
                            <span className="text-xs text-muted-foreground">
                              ServiceID: {line.ServiceID}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(line.UnitPrice)}</TableCell>
                        <TableCell>{formatCurrency(line.SubTotal)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteServiceLine(line.WorkOrderDetailID)}
                            disabled={deletingServiceId === line.WorkOrderDetailID}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingServiceId === line.WorkOrderDetailID ? 'Đang xóa...' : 'Xóa'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dịch vụ nào.</p>
              )}
              <div className="grid gap-3 md:grid-cols-3 items-end pt-2">
                <div>
                  <Label>Dịch vụ</Label>
                  <select
                    value={newServiceLine.serviceId}
                    onChange={(e) => {
                      const selectedServiceId = e.target.value
                      const selectedService = servicesList.find(s => String(s.ServiceID) === selectedServiceId)
                      setNewServiceLine((prev) => ({
                        ...prev,
                        serviceId: selectedServiceId,
                        unitPrice: selectedService && selectedService.StandardCost > 0 
                          ? String(selectedService.StandardCost) 
                          : ''
                      }))
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {servicesList.map((s) => (
                      <option key={s.ServiceID} value={s.ServiceID}>
                        {s.ServiceName} {s.StandardCost > 0 ? `(${formatCurrency(s.StandardCost)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Đơn giá (tùy chọn)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1000"
                    value={newServiceLine.unitPrice}
                    onChange={(e) =>
                      setNewServiceLine((prev) => ({ ...prev, unitPrice: e.target.value }))
                    }
                    placeholder="Bỏ trống để dùng giá chuẩn"
                  />
                </div>
                <Button type="button" disabled={addingService} onClick={handleAddServiceLine}>
                  {addingService ? 'Đang thêm...' : 'Thêm dịch vụ'}
                </Button>
              </div>
            </div>
        </div>

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border/60 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>

            {/* 'Lưu & chuyển trạng thái' button removed to avoid duplicate update actions */}

            {selectedOrder?.WorkOrderID && statusInput === 'Completed' && (
              <Button type="button" variant="secondary" onClick={handleGoToPayment} disabled={submitting}>
                Chuyển sang Thanh toán
              </Button>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : selectedOrder?.WorkOrderID ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
