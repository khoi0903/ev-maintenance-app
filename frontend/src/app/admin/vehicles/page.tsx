'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import type { Vehicle } from '@/types/entities'

interface AdminVehicle extends Vehicle {
  ownerName?: string | null
  ownerPhone?: string | null
  ownerEmail?: string | null
  brand?: string | null
  modelName?: string | null
  mileage?: number | null
  batterySOH?: number | null
}

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [modelFilter, setModelFilter] = useState<string>('All')
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await adminService.listVehicles()
        if (res.success) {
          const mapped = (res.data || []).map((raw: any) => ({
            ...raw,
            brand: raw.Brand ?? raw.brand ?? null,
            modelName: raw.modelName ?? raw.Model ?? null,
            mileage: raw.mileage ?? raw.Mileage ?? null,
            batterySOH: raw.batterySOH ?? raw.batterySoh ?? raw.BatterySOH ?? null,
          }))
          setVehicles(mapped as AdminVehicle[])
        } else {
          setError(res.error?.message || 'Không thể tải danh sách xe')
        }
      } catch (e: any) {
        console.error(e)
        setError(e?.message || 'Không thể tải danh sách xe')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const uniqueModels = useMemo(
    () =>
      Array.from(
        new Set(
          vehicles.map((v) => {
            if (v.brand || v.modelName) {
              return `${v.brand ?? ''} ${v.modelName ?? ''}`.trim()
            }
            return ''
          })
        )
      ).filter(Boolean),
    [vehicles]
  )

  const filteredVehicles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return vehicles.filter((v) => {
      const modelLabel = `${v.brand ?? ''} ${v.modelName ?? ''}`.trim()
      const matchesSearch =
        !keyword ||
        v.VIN?.toLowerCase().includes(keyword) ||
        v.LicensePlate?.toLowerCase().includes(keyword) ||
        v.ownerName?.toLowerCase().includes(keyword) ||
        modelLabel.toLowerCase().includes(keyword)
      const matchesModel = modelFilter === 'All' || modelLabel === modelFilter
      return matchesSearch && matchesModel
    })
  }, [vehicles, searchTerm, modelFilter])


  if (loading) return <p className="p-6 text-sm text-muted-foreground">Đang tải dữ liệu...</p>

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
        <p className="text-muted-foreground mt-2">
          Theo dõi thông tin xe điện mà khách hàng đã đăng ký và gắn với tài khoản.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="Tìm VIN / biển số / chủ xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="All">Tất cả Model</option>
              {uniqueModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <div className="text-sm text-muted-foreground flex items-center">
              Tổng số xe: <span className="ml-2 font-medium text-foreground">{filteredVehicles.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Xe đã đăng ký</CardTitle>
          <CardDescription>
            Thông tin được đồng bộ theo dữ liệu khách hàng trong hệ thống EV Service Center.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Biển số</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Năm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((v) => {
                  const modelLabel = `${v.brand ?? ''} ${v.modelName ?? ''}`.trim() || '—'
                  return (
                    <TableRow key={`${v.VehicleID}-${v.VIN}`}>
                      <TableCell className="font-mono text-sm">{v.VIN}</TableCell>
                      <TableCell>{v.LicensePlate || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{modelLabel}</span>
                          {v.Color && (
                            <span className="text-xs text-muted-foreground">Màu: {v.Color}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{v.ownerName || '—'}</span>
                          <span className="text-xs text-muted-foreground">
                            ID khách: {v.AccountID ?? '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{v.ownerPhone || '—'}</span>
                          <span className="text-xs text-muted-foreground">{v.ownerEmail || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>{v.Year || '—'}</TableCell>
                    </TableRow>
                  )
                })}
                {!filteredVehicles.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Không tìm thấy xe phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
