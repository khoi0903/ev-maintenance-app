// app/user/appointment/new/page.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'
import { cn } from '@/lib/utils'
import { http } from '@/lib/api'

type Service = {
  ServiceID: number
  ServiceName: string
  StandardCost: number
  Description: string
  ImageUrl?: string
  Category?: string
}

type ServiceOneResponse = { success: boolean; data: Service }
type ServiceListResponse = { success: boolean; data: Service[] }

type CreateAppointmentResponse = {
  success: boolean
  data: {
    AppointmentID: number
    Code?: string
    InvoiceID?: number | null
    InvoiceAmount?: number | null
  }
  message?: string
}

// Helper extractData
function extractData<T>(res: any): T {
  if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
    return (res as any).data as T
  }
  if (res && typeof res === 'object' && 'data' in res) {
    const inner = (res as any).data
    if (inner && typeof inner === 'object' && 'success' in inner && 'data' in inner) {
      return (inner as any).data as T
    }
    return inner as T
  }
  return res as T
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const params = useSearchParams()
  const serviceId = params.get('serviceId')

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [loadingService, setLoadingService] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [myVehicles, setMyVehicles] = useState<any[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)

  const [formData, setFormData] = useState({
    vehicleId: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  })

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  // ===== Load service theo id =====
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        setLoadingService(true)
        if (!serviceId) {
          setSelectedService(null)
          return
        }

        try {
          const r1 = await http.get<ServiceOneResponse>(`/services/${serviceId}`)
          if (!mounted) return
          const service = extractData<Service>(r1)
          if (!service) throw new Error('Không tìm thấy dịch vụ')
          setSelectedService(service)
        } catch {
          const r2 = await http.get<ServiceListResponse>('/services')
          if (!mounted) return
          const services = extractData<Service[]>(r2) || []
          const found = services.find(s => String(s.ServiceID) === String(serviceId))
          if (!found) throw new Error('Không tìm thấy dịch vụ')
          setSelectedService(found)
        }
      } catch (e: any) {
        if (!mounted) return
        setSelectedService(null)
        setError(e?.message || 'Không thể tải thông tin dịch vụ')
      } finally {
        if (mounted) setLoadingService(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [serviceId])

  // ===== Load My Vehicles =====
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setVehiclesLoading(true)
        const res = await http.get<any>('/vehicles')
        let list: any[] = extractData<any[]>(res)
        if (!Array.isArray(list)) list = []
        if (!alive) return
        setMyVehicles(list || [])
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Không tải được danh sách xe')
        setMyVehicles([])
      } finally {
        if (alive) setVehiclesLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return setError('Vui lòng chọn dịch vụ')

    if (!formData.vehicleId) return setError('Vui lòng chọn xe từ danh sách')
    if (!formData.preferredDate || !formData.preferredTime)
      return setError('Vui lòng chọn ngày và giờ mong muốn')

    const selectedVehicle = myVehicles.find(v =>
      String(v.VehicleID || v.id) === String(formData.vehicleId)
    )
    if (!selectedVehicle) return setError('Không tìm thấy thông tin xe đã chọn')

    setError(null)
    setSaving(true)
    try {
      const preferredDateTime = new Date(
        `${formData.preferredDate}T${formData.preferredTime}:00`
      )

      const vin = (selectedVehicle.VIN || selectedVehicle.vin || '')
        .trim()
        .toUpperCase()
      if (!vin) return setError('Xe đã chọn không có số VIN hợp lệ')

      const licensePlate = (
        selectedVehicle.LicensePlate ||
        selectedVehicle.licensePlate ||
        ''
      )
        .trim()
        .toUpperCase()
      if (!licensePlate) return setError('Xe đã chọn không có biển số hợp lệ')

      const modelId =
        selectedVehicle.ModelID ||
        selectedVehicle.modelId ||
        selectedVehicle.ModelID
      if (!modelId) return setError('Xe đã chọn không có Model ID hợp lệ')

      const body = {
        ServiceID: selectedService.ServiceID,
        PreferredDateTime: preferredDateTime.toISOString(),
        VIN: vin,
        LicensePlate: licensePlate,
        ModelID: Number(modelId),
        Notes: formData.notes || null,
      }

      const res = await http.post<CreateAppointmentResponse>('/appointments', body)
      const apptData = extractData<CreateAppointmentResponse['data']>(res)

      if (!apptData?.AppointmentID) {
        throw new Error('Không nhận được AppointmentID')
      }

      // 🔹 Lưu tempAppointment cho trang Payment dùng
      const tempAppointment = {
        AppointmentID: apptData.AppointmentID,
        ServiceID: selectedService.ServiceID,
        InvoiceID: apptData.InvoiceID ?? null,
        InvoiceAmount: apptData.InvoiceAmount ?? null,
      }
      sessionStorage.setItem('tempAppointment', JSON.stringify(tempAppointment))

      // 🔹 Lưu info cho màn hình success / progress
      sessionStorage.setItem(
        'recentAppointmentSuccess',
        JSON.stringify({
          appointmentId: apptData.AppointmentID,
          serviceId: selectedService.ServiceID,
          serviceName: selectedService.ServiceName,
          scheduledAt: preferredDateTime.toISOString(),
        })
      )

      // 🔹 Nếu backend đã tạo Invoice luôn
      if (apptData.InvoiceID) {
        sessionStorage.setItem('lastInvoiceId', String(apptData.InvoiceID))
      }

      router.push('/user/progress')
    } catch (e: any) {
      setError(e?.message || 'Không thể tạo lịch hẹn. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const formattedPreview = useMemo(() => {
    if (!formData.preferredDate || !formData.preferredTime) return ''
    const d = new Date(`${formData.preferredDate}T${formData.preferredTime}:00`)
    return `Hẹn lúc ${d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })} ngày ${d.toLocaleDateString('vi-VN')}`
  }, [formData.preferredDate, formData.preferredTime])

  if (loadingService) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải thông tin dịch vụ...</p>
        </div>
      </div>
    )
  }

  if (!selectedService) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đặt Lịch Hẹn</h1>
          <p className="text-muted-foreground mt-2">
            Vui lòng chọn dịch vụ từ trang Danh mục dịch vụ
          </p>
        </div>
        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10">
            <CardContent className="pt-4">
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Button
                onClick={() => router.push('/user/service')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Quay lại Chọn Dịch vụ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Đặt Lịch Hẹn</h1>
        <p className="text-muted-foreground mt-2">
          Điền thông tin để đặt lịch. Bạn sẽ thanh toán sau khi kỹ thuật viên hoàn tất dịch vụ.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10">
          <CardContent className="pt-4">
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Service */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400">
            ✓ Dịch vụ đã chọn
          </CardTitle>
          <CardDescription>
            Thông tin dịch vụ sẽ được tự động điền vào form đặt lịch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Tên dịch vụ:
              </span>
              <p className="text-lg font-semibold">
                {selectedService.ServiceName}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Mô tả:
              </span>
              <p className="text-sm">{selectedService.Description}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Chi phí chuẩn:
              </span>
              <p className="text-xl font-bold text-green-600 dark:text-green-500">
                {formatCurrency(selectedService.StandardCost)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin Đặt lịch</CardTitle>
          <CardDescription>
            Vui lòng điền đầy đủ thông tin để hoàn tất đặt lịch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Selection */}
            <div>
              <Label htmlFor="vehicleId">
                Chọn xe <span className="text-red-500">*</span>
              </Label>
              <select
                id="vehicleId"
                value={formData.vehicleId}
                onChange={e =>
                  setFormData({ ...formData, vehicleId: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={vehiclesLoading}
              >
                <option value="">
                  {vehiclesLoading
                    ? 'Đang tải danh sách xe…'
                    : '-- Chọn xe của bạn --'}
                </option>
                {myVehicles.map(v => {
                  const vin = (v.VIN || v.vin || '').trim()
                  const plate = (v.LicensePlate || v.licensePlate || '').trim()
                  const brand = (v.Brand || v.brand || '').trim()
                  const model = (v.ModelName || v.modelName || '').trim()
                  const displayName = [plate, vin, brand, model]
                    .filter(Boolean)
                    .join(' - ')
                  return (
                    <option key={v.VehicleID || v.id} value={v.VehicleID || v.id}>
                      {displayName || `Xe #${v.VehicleID || v.id}`}
                    </option>
                  )
                })}
              </select>
              {myVehicles.length === 0 && !vehiclesLoading && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Bạn chưa có xe nào. Vui lòng{' '}
                  <a href="/user/vehicles" className="underline font-medium">
                    đăng ký xe mới
                  </a>{' '}
                  trước khi đặt lịch.
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="preferredDate">
                Ngày mong muốn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                min={todayStr}
                onChange={e =>
                  setFormData({ ...formData, preferredDate: e.target.value })
                }
                required
              />
            </div>

            {/* Time */}
            <div>
              <Label htmlFor="preferredTime">
                Giờ mong muốn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="preferredTime"
                type="time"
                value={formData.preferredTime}
                onChange={e =>
                  setFormData({ ...formData, preferredTime: e.target.value })
                }
                required
              />
            </div>

            {/* Preview */}
            {formattedPreview && (
              <p className="text-green-700 text-sm font-medium">
                {formattedPreview}
              </p>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Ghi chú (Tùy chọn)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Thêm ghi chú hoặc yêu cầu đặc biệt..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <input
              type="hidden"
              name="serviceId"
              value={selectedService.ServiceID}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/user/service')}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={cn(
                  'flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold'
                )}
              >
                {saving ? 'Đang gửi yêu cầu…' : 'Xác nhận đặt lịch'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}