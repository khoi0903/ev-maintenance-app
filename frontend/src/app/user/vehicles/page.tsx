/* eslint-disable @typescript-eslint/no-misused-promises */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { userService } from '@/services/user.service'
import type { Vehicle } from '@/types/entities'

type FormState = {
  vin: string
  licensePlate: string
  brand: string
  modelName: string
  year: string
  color: string
  mileage: string
}

const EMPTY_FORM: FormState = {
  vin: '',
  licensePlate: '',
  brand: '',
  modelName: '',
  year: '',
  color: '',
  mileage: '',
}

type ManagedVehicle = Vehicle & {
  mileage?: number | null
  batterySoh?: number | null
}

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = useState<ManagedVehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [vinChecking, setVinChecking] = useState(false)
  const [vinExists, setVinExists] = useState(false)

  const hasVehicles = useMemo(() => vehicles.length > 0, [vehicles])

  const resetMessages = () => {
    setError(null)
    setSuccess(null)
    setVinExists(false)
    setVinChecking(false)
  }

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      resetMessages()
      const res = await userService.myVehicles()
      if (res.success) {
        const list = Array.isArray(res.data) ? (res.data as ManagedVehicle[]) : []
        const normalized = list.map((item) => {
          const clone: ManagedVehicle = { ...item }
          if (clone.batterySoh == null && (clone as any).batterySOH != null) {
            clone.batterySoh = Number((clone as any).batterySOH)
          }
          if (clone.mileage == null) {
            const rawMileage = (clone as any).Mileage ?? null
            if (rawMileage != null) clone.mileage = Number(rawMileage)
          }
          if (clone.batterySoh == null) {
            const rawBattery =
              (clone as any).batterySOH ??
              (clone as any).BatterySOH ??
              (clone as any).batterySoh ??
              null
            if (rawBattery != null) {
              clone.batterySoh = Number(rawBattery)
            } else if (clone.Notes) {
              try {
                const parsed = JSON.parse(clone.Notes as any)
                if (parsed?.batterySoh != null) clone.batterySoh = Number(parsed.batterySoh)
                if (parsed?.mileage != null && clone.mileage == null) {
                  clone.mileage = Number(parsed.mileage)
                }
              } catch {
                // ignore malformed notes
              }
            }
          }
          return clone
        })
        setVehicles(normalized)
      } else {
        throw new Error(res.error?.message || 'Không thể tải danh sách xe')
      }
    } catch (err: any) {
      console.error('load vehicles error', err)
      setError(err?.message || 'Không thể tải danh sách xe')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchVehicles()
  }, [])

  // Kiểm tra VIN khi user nhập (debounced)
  useEffect(() => {
    const vin = form.vin.trim().toUpperCase()
    if (!vin || vin.length < 6 || editingId) {
      setVinExists(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setVinChecking(true)
        const res = await userService.myVehicles()
        if (res.success) {
          const vehicles = res.data as Vehicle[]
          const exists = vehicles.some(v => {
            const vVin = (v as any).VIN || (v as any).vin || ''
            return String(vVin).toUpperCase() === vin
          })
          setVinExists(exists)
          if (exists) {
            setError('Số VIN này đã được đăng ký trong hệ thống. Vui lòng sử dụng chức năng chỉnh sửa nếu đây là xe của bạn.')
          }
        }
      } catch (err) {
        // Ignore check errors
        setVinExists(false)
      } finally {
        setVinChecking(false)
      }
    }, 800) // Debounce 800ms

    return () => clearTimeout(timer)
  }, [form.vin, editingId])

  const updateForm = (field: keyof FormState, value: string) => {
    resetMessages()
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const normalizePayload = (state: FormState) => {
    const payload: Record<string, any> = {
      VIN: state.vin.trim().toUpperCase(),
      LicensePlate: state.licensePlate.trim().toUpperCase(),
      Brand: state.brand.trim(),
      ModelName: state.modelName.trim(),
      Color: state.color.trim() || null,
    }
    if (state.year.trim()) {
      const yearVal = Number(state.year)
      if (!Number.isNaN(yearVal)) {
        payload.Year = yearVal
      }
    }
    const mileageVal = state.mileage.trim() ? Number(state.mileage) : null
    const notesPayload: Record<string, any> = {}
    if (mileageVal != null && !Number.isNaN(mileageVal)) {
      notesPayload.mileage = mileageVal
    }
    if (Object.keys(notesPayload).length) {
      payload.Notes = JSON.stringify(notesPayload)
    }
    return payload
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    resetMessages()

    if (!form.vin.trim() || form.vin.trim().length < 6) {
      setError('Vui lòng nhập số VIN hợp lệ (tối thiểu 6 ký tự).')
      return
    }
    if (vinExists && !editingId) {
      setError('VIN này đã tồn tại trong danh sách xe của bạn. Vui lòng sử dụng chức năng chỉnh sửa.')
      return
    }
    if (!form.licensePlate.trim()) {
      setError('Vui lòng nhập biển số.')
      return
    }
    if (!form.brand.trim() || !form.modelName.trim()) {
      setError('Vui lòng nhập hãng xe và dòng xe.')
      return
    }

    try {
      setSaving(true)
      const payload = normalizePayload(form)

      if (editingId) {
        const res = await userService.updateMyVehicle(editingId, payload)
        if (!res.success) {
          throw new Error(res.error?.message || 'Không thể cập nhật xe')
        }
        setSuccess('Đã cập nhật thông tin xe thành công.')
      } else {
        const res = await userService.addMyVehicle(payload)
        if (!res.success) {
          // Lấy message từ API response
          const apiMessage = res.error?.message || 'Không thể đăng ký xe mới'
          throw new Error(apiMessage)
        }
        setSuccess('Đăng ký xe thành công!')
      }

      setForm({ ...EMPTY_FORM })
      setEditingId(null)
      await fetchVehicles()
    } catch (err: any) {
      console.error('save vehicle failed', err)
      // Parse error message từ API response
      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại.'
      if (err?.message) {
        errorMessage = err.message
        // Nếu message chứa JSON, thử parse
        if (errorMessage.includes('{') && errorMessage.includes('"message"')) {
          try {
            const jsonMatch = errorMessage.match(/\{.*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.message) errorMessage = parsed.message;
            }
          } catch {
            // Ignore parse error
          }
        }
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (vehicle: ManagedVehicle) => {
    resetMessages()
    setEditingId(vehicle.VehicleID ?? null)
    setForm({
      vin: vehicle.VIN ?? '',
      licensePlate: vehicle.LicensePlate ?? '',
      brand: vehicle.Brand ?? vehicle.brand ?? '',
      modelName: vehicle.ModelName ?? vehicle.modelName ?? vehicle.Model ?? '',
      year: vehicle.Year ? String(vehicle.Year) : '',
      color: vehicle.Color ?? '',
      mileage: vehicle.mileage != null ? String(vehicle.mileage) : '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    resetMessages()
  }

  const removeVehicle = async (vehicle: ManagedVehicle) => {
    if (!vehicle.VehicleID) return
    const confirmed = window.confirm(`Bạn chắc chắn muốn xóa xe ${vehicle.LicensePlate || vehicle.VIN}?`)
    if (!confirmed) return

    try {
      resetMessages()
      await userService.deleteMyVehicle(vehicle.VehicleID)
      setSuccess('Đã xóa xe thành công.')
      await fetchVehicles()
    } catch (err: any) {
      console.error('delete vehicle error', err)
      setError(err?.message || 'Không thể xóa xe.')
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Xe Của Tôi</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin phương tiện của bạn để đặt lịch dịch vụ nhanh chóng và tránh lỗi trùng VIN.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Chỉnh sửa xe' : 'Đăng ký xe mới'}</CardTitle>
          <CardDescription>
            Điền thông tin chính xác theo cavet/giấy tờ xe. VIN và biển số sẽ được viết hoa tự động để tránh nhầm lẫn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vin">Số VIN <span className="text-red-500">*</span></Label>
                <div className="space-y-1">
                  <Input
                    id="vin"
                    value={form.vin}
                    onChange={(event) => updateForm('vin', event.target.value.toUpperCase())}
                    placeholder="Ví dụ: VF8TG4H5YRA999999"
                    maxLength={40}
                    required
                    className={vinExists ? 'border-amber-500' : ''}
                  />
                  {vinChecking && (
                    <p className="text-xs text-muted-foreground">Đang kiểm tra VIN...</p>
                  )}
                  {vinExists && !vinChecking && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ VIN này đã có trong danh sách xe của bạn. Vui lòng sử dụng chức năng chỉnh sửa.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">Biển số <span className="text-red-500">*</span></Label>
                <Input
                  id="licensePlate"
                  value={form.licensePlate}
                  onChange={(event) => updateForm('licensePlate', event.target.value.toUpperCase())}
                  placeholder="ví dụ: 51G-123.45"
                  maxLength={20}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Hãng xe <span className="text-red-500">*</span></Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(event) => updateForm('brand', event.target.value)}
                  placeholder="VinFast, Tesla, Hyundai..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelName">Model/Dòng xe <span className="text-red-500">*</span></Label>
                <Input
                  id="modelName"
                  value={form.modelName}
                  onChange={(event) => updateForm('modelName', event.target.value)}
                  placeholder="VF 8, Model 3..."
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="year">Năm sản xuất</Label>
                <Input
                  id="year"
                  value={form.year}
                  onChange={(event) => updateForm('year', event.target.value.replace(/\D/g, ''))}
                  placeholder="2024"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Màu sắc</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(event) => updateForm('color', event.target.value)}
                  placeholder="Trắng, Đỏ, ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Số km đã đi</Label>
                <Input
                  id="mileage"
                  value={form.mileage}
                  onChange={(event) => updateForm('mileage', event.target.value.replace(/\D/g, ''))}
                  placeholder="Ví dụ: 35000"
                  inputMode="numeric"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? (editingId ? 'Đang cập nhật...' : 'Đang đăng ký...') : editingId ? 'Lưu thay đổi' : 'Đăng ký xe mới'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                  Hủy chỉnh sửa
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Danh sách xe đã đăng ký</CardTitle>
            <CardDescription>
              {hasVehicles
                ? 'Thông tin phương tiện đã liên kết với tài khoản của bạn.'
                : 'Chưa có xe nào được đăng ký.'}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Tổng số xe: <span className="font-semibold text-foreground">{vehicles.length}</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
              Đang tải danh sách xe...
            </div>
          ) : !vehicles.length ? (
            <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
              Bạn chưa đăng ký xe nào. Hãy thêm phương tiện mới để tiếp tục đặt lịch dịch vụ.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VIN</TableHead>
                      <TableHead>Biển số</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Năm</TableHead>
                      <TableHead>Màu sắc</TableHead>
                      <TableHead>Số km</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => {
                      const modelLabel = `${vehicle.Brand ?? vehicle.brand ?? ''} ${vehicle.ModelName ?? vehicle.modelName ?? ''}`.trim()
                      const mileageRaw =
                        vehicle.mileage ??
                        (vehicle as any).Mileage ??
                        null
                      const mileageValue =
                        mileageRaw != null && !Number.isNaN(Number(mileageRaw))
                          ? Number(mileageRaw)
                          : null
                      return (
                        <TableRow key={vehicle.VehicleID ?? vehicle.VIN}>
                          <TableCell className="font-mono text-sm font-medium uppercase">{vehicle.VIN || '—'}</TableCell>
                          <TableCell className="font-medium uppercase">{vehicle.LicensePlate || '—'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{modelLabel || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{vehicle.Year || '—'}</TableCell>
                          <TableCell>{vehicle.Color || '—'}</TableCell>
                          <TableCell>
                            {mileageValue != null
                              ? `${mileageValue.toLocaleString('vi-VN')} km`
                              : '—'}
                          </TableCell>
                          <TableCell className="space-x-2 text-right">
                            <Button size="sm" variant="secondary" onClick={() => startEdit(vehicle)}>
                              Chỉnh sửa
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => removeVehicle(vehicle)}>
                              Xóa
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="my-4 h-px w-full bg-muted" />
              <p className="text-xs text-muted-foreground">
                Khi chỉnh sửa thông tin xe, các lịch hẹn đang chờ xử lý sẽ sử dụng dữ liệu mới nhất.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

