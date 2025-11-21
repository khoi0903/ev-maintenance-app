'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Vehicle {
  model: string
  vin: string
  odometer: number // km
  nextMaintenanceKm?: number
}

interface MyVehicleWidgetProps {
  vehicle?: Vehicle
  className?: string
}

/**
 * My Vehicle Widget - Hiển thị thông tin xe của khách hàng
 */
export default function MyVehicleWidget({ 
  vehicle,
  className 
}: MyVehicleWidgetProps) {
  const defaultVehicle: Vehicle = {
    model: 'VinFast VF8',
    vin: 'VIN1234567890ABCDEF',
    odometer: 18500,
    nextMaintenanceKm: 2000,
  }

  const displayVehicle = vehicle || defaultVehicle
  const needsMaintenance = displayVehicle.nextMaintenanceKm && displayVehicle.nextMaintenanceKm <= 2000

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Chiếc Xe Của Tôi</CardTitle>
        <CardDescription>Thông tin xe đăng ký</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Model */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Model</p>
            <p className="text-base font-semibold">{displayVehicle.model}</p>
          </div>

          {/* VIN */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">VIN</p>
            <p className="text-base font-mono text-sm">{displayVehicle.vin}</p>
          </div>

          {/* Odometer */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Odometer</p>
            <p className="text-base font-semibold">
              {displayVehicle.odometer.toLocaleString('vi-VN')} km
            </p>
          </div>

          {/* Maintenance Warning */}
          {needsMaintenance && displayVehicle.nextMaintenanceKm && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Cảnh báo Bảo dưỡng
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Sắp đến hạn Bảo dưỡng Định kỳ ({displayVehicle.nextMaintenanceKm.toLocaleString('vi-VN')} km còn lại)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* View Details Link - Removed */}
        </div>
      </CardContent>
    </Card>
  )
}

