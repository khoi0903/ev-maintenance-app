'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { http } from '@/lib/api' // 👈 dùng http.get/post...
import { userService } from '@/services/user.service'
import type { Vehicle } from '@/types/entities'

/** Service Interface - Dựa trên bảng ServiceCatalog */
interface Service {
  ServiceID: number
  ServiceName: string
  StandardCost: number
  Description: string
  ImageUrl?: string
  Category?: string
}

/** API shape BE trả về */
interface ServiceListResponse {
  success: boolean
  data: Service[]
}

/** Service Page - Trang Lựa chọn Dịch vụ Bảo Dưỡng Xe Điện */
export default function ServicePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingVehicles, setCheckingVehicles] = useState(true)
  const [hasVehicles, setHasVehicles] = useState(false)
  const [vehicleError, setVehicleError] = useState<string | null>(null)

  /** Gọi API /api/services để lấy danh sách dịch vụ
   * - http.get tự gắn Authorization (qua lib/api)
   * - Nếu 401 → lib/api tự redirect /signin?next=...
   */
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        setLoading(true)
        const res = await http.get<ServiceListResponse>('/services')
        if (mounted) setServices(res.data || [])
      } catch (e: any) {
        if (mounted) {
          setError(
            e?.message ||
              'Không thể tải dịch vụ. Kiểm tra API /api/services, token, và CORS.'
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setVehicleError(null)
        const res = await userService.myVehicles()
        if (!mounted) return
        if (res.success) {
          const data = res.data as Vehicle[] | undefined
          setHasVehicles((data?.length ?? 0) > 0)
        } else {
          setHasVehicles(false)
          setVehicleError(res.error?.message || 'Không thể tải danh sách xe.')
        }
      } catch (err: any) {
        if (mounted) {
          setHasVehicles(false)
          setVehicleError(err?.message || 'Không thể tải danh sách xe.')
        }
      } finally {
        if (mounted) setCheckingVehicles(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  /** Format tiền VND */
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  /** Lọc theo search + category */
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        searchTerm === '' ||
        service.ServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.Description || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = filterCategory === 'all' || service.Category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [services, searchTerm, filterCategory])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">
          CHỌN DỊCH VỤ BẢO DƯỠNG XE ĐIỆN
        </h1>
        <p className="text-muted-foreground mt-2">
          Lựa chọn dịch vụ phù hợp với nhu cầu của bạn và đặt lịch hẹn ngay
        </p>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10">
          <CardContent className="pt-4">
            <div className="text-red-600 dark:text-red-400 text-sm">
              <div className="font-semibold mb-1">Không thể tải dịch vụ</div>
              <div>{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {!checkingVehicles && !hasVehicles && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700">
          <CardContent className="pt-4 space-y-3">
            <div className="text-sm text-amber-700 dark:text-amber-200">
              <p className="font-semibold mb-1">Chưa có thông tin xe</p>
              <p>
                Bạn cần đăng ký ít nhất một phương tiện ở mục <span className="font-semibold">My Vehicles</span>{" "}
                trước khi đặt dịch vụ để tránh lỗi trùng VIN.
              </p>
              {vehicleError && <p className="mt-2 text-xs text-amber-600">{vehicleError}</p>}
            </div>
            <div>
              <Link href="/user/vehicles">
                <Button className="bg-green-600 hover:bg-green-700 text-white">Đăng ký xe ngay</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="maintenance">Bảo Dưỡng</option>
                <option value="battery">Kiểm Tra Pin</option>
                <option value="repair">Sửa Chữa</option>
                <option value="general">Dịch Vụ Khác</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {loading ? <>Đang tải dịch vụ...</> : <>Tìm thấy <span className="font-semibold text-foreground">{filteredServices.length}</span> dịch vụ</>}
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700" />
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </CardHeader>
              <CardContent className="pb-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">Không tìm thấy dịch vụ nào phù hợp</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilterCategory('all')
              }}
              className="mt-4"
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          filteredServices.map((service) => (
            <Card
              key={service.ServiceID}
              className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                {service.ImageUrl ? (
                  <img
                    src={service.ImageUrl}
                    alt={`Hình ảnh dịch vụ ${service.ServiceName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400',
                    service.ImageUrl ? 'hidden' : ''
                  )}
                >
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2">🔧</div>
                    <p className="text-xs text-center font-medium">Hình ảnh dịch vụ</p>
                    <p className="text-xs text-center mt-1 opacity-75">{service.ServiceName}</p>
                  </div>
                </div>
              </div>

              <CardHeader className="flex-1">
                <CardTitle className="text-xl font-bold line-clamp-2 min-h-[3.5rem]">
                  {service.ServiceName}
                </CardTitle>
                <CardDescription className="line-clamp-3 mt-2 text-sm">
                  {service.Description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(service.StandardCost)}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    if (!hasVehicles) return
                    sessionStorage.setItem(
                      'selectedService',
                      JSON.stringify({ ServiceID: service.ServiceID, ServiceName: service.ServiceName })
                    )
                    router.push(`/user/appointments/new?serviceId=${service.ServiceID}`)
                  }}
                  disabled={checkingVehicles || !hasVehicles}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base disabled:cursor-not-allowed disabled:bg-green-400 disabled:text-white/80"
                >
                  {checkingVehicles
                    ? 'Đang kiểm tra...'
                    : hasVehicles
                    ? 'CHỌN DỊCH VỤ'
                    : 'ĐĂNG KÝ XE TRƯỚC'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
