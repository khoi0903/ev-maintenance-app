'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Vehicle Detail Page - Trang chi tiết thông tin xe
 */
export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vin = params.vin as string

  // In a real app, fetch vehicle data by VIN
  const vehicleData = {
    vin,
    model: 'Model A',
    year: 2022,
    ownerName: 'Nguyễn Văn A',
    ownerPhone: '0901234567',
    odometer: 45000,
    warrantyEndDate: '2030-12-31',
    batterySOH: 95,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()}>
            ← Quay lại
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-4">
            Chi tiết Xe - {vin}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Xe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">VIN</p>
              <p className="font-medium font-mono">{vehicleData.vin}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model & Year</p>
              <p className="font-medium">{vehicleData.model} {vehicleData.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Odometer</p>
              <p className="font-medium">{vehicleData.odometer.toLocaleString()} km</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin Chủ xe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tên</p>
              <p className="font-medium">{vehicleData.ownerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số điện thoại</p>
              <p className="font-medium">{vehicleData.ownerPhone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bảo hành</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-muted-foreground">Ngày kết thúc</p>
              <p className="font-medium">{vehicleData.warrantyEndDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


