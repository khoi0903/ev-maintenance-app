// app/user/workorders/[id]/page.tsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { userService } from "@/services/user.service"
import type { CurrentWorkOrderDto } from "@/types/workorder"
import type { Invoice } from "@/types/entities"

type WorkOrderDetailDto = CurrentWorkOrderDto & {
  AppointmentID?: number | null
  ServiceID?: number | null
  VehicleID?: number | null
  Notes?: string | null
  ServiceDetails?: {
    WorkOrderDetailID: number
    ServiceID: number
    ServiceName: string
    Quantity: number
    UnitPrice: number
    SubTotal?: number | null
  }[]
  Parts?: {
    UsageID: number
    PartID: number
    PartName: string
    Quantity: number
    UnitPrice: number
    SubTotal?: number | null
    SuggestedByTech?: boolean | number | null
    ApprovedByStaff?: boolean | number | null
  }[]
  Invoice?: Invoice | null
}

function formatDateTime(dt?: string | null) {
  if (!dt) return "—"
  try {
    return new Date(dt).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    })
  } catch {
    return dt
  }
}

function formatCurrency(amount: number | undefined | null) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0))
}

export default function UserWorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [detail, setDetail] = useState<WorkOrderDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await userService.getMyWorkOrderDetail(Number(id))
        if (!alive) return

        if (res?.success) {
          setDetail(res.data as any)
        } else {
          setDetail(null)
          setError(res?.error?.message || "Không thể tải chi tiết công việc")
        }
      } catch (e: any) {
        if (!alive) return
        setDetail(null)
        setError(e?.message || "Không thể tải chi tiết công việc")
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [id])

  const hasInvoice = useMemo(
    () => !!(detail && (detail as any).Invoice && (detail as any).Invoice.InvoiceID),
    [detail]
  )

  const invoiceId = hasInvoice ? (detail as any).Invoice.InvoiceID : null

  // Chỉ cho thanh toán khi workorder đã hoàn tất
  const canPay = useMemo(() => {
    if (!hasInvoice || !detail) return false
    const status = (detail as any).Status || (detail as any).ProgressStatus
    if (!status) return false
    return status === "Done" || status === "Completed"
  }, [detail, hasInvoice])

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Đang tải chi tiết công việc...</p>
  }

  if (!detail) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="outline" onClick={() => router.push("/user/progress")}>
          ← Quay lại Tiến độ
        </Button>
        <p className="text-sm text-red-500">{error || "Không tìm thấy công việc này."}</p>
      </div>
    )
  }

  const serviceRows = detail.ServiceDetails || []
  const partRows = detail.Parts || []

  const totalService = serviceRows.reduce((sum, s) => {
    const sub = (s as any).SubTotal
    const calc = (s.Quantity || 0) * (s.UnitPrice || 0)
    return sum + Number(sub != null ? sub : calc)
  }, 0)

  const totalParts = partRows.reduce((sum, p) => {
    const sub = (p as any).SubTotal
    const calc = (p.Quantity || 0) * (p.UnitPrice || 0)
    return sum + Number(sub != null ? sub : calc)
  }, 0)

  const grandTotal = totalService + totalParts

  const statusText = (detail as any).Status || (detail as any).ProgressStatus || "Unknown"

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Công việc #{detail.WorkOrderID}
          </h1>
          <p className="text-muted-foreground mt-1">
            Biển số: <b>{(detail as any).LicensePlate || "—"}</b> • Trạng thái:{" "}
            <b>{statusText}</b>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/user/progress")}>
          ← Quay lại Tiến độ
        </Button>
      </div>

      {/* Thông tin chung */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Dịch vụ chính: </span>
            <b>{(detail as any).ServiceName || "Dịch vụ EV Maintenance"}</b>
          </p>
          <p>
            <span className="text-muted-foreground">Bắt đầu: </span>
            {formatDateTime((detail as any).StartedAt || (detail as any).StartTime)}
          </p>
          <p>
            <span className="text-muted-foreground">Hoàn tất: </span>
            {formatDateTime((detail as any).CompletedAt || (detail as any).EndTime)}
          </p>
          {detail.Notes && (
            <p>
              <span className="text-muted-foreground">Ghi chú: </span>
              {detail.Notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dịch vụ trong WorkOrder */}
      {serviceRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dịch vụ trong WorkOrder</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left">Dịch vụ</th>
                  <th className="py-2 text-right">SL</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {serviceRows.map((s) => {
                  const sub = (s as any).SubTotal
                  const calc = (s.Quantity || 0) * (s.UnitPrice || 0)
                  const lineTotal = Number(sub != null ? sub : calc)
                  return (
                    <tr key={s.WorkOrderDetailID} className="border-b last:border-0">
                      <td className="py-2">{s.ServiceName}</td>
                      <td className="py-2 text-right">{s.Quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(s.UnitPrice)}</td>
                      <td className="py-2 text-right">{formatCurrency(lineTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="py-2 text-right font-semibold">
                    Tổng tiền dịch vụ
                  </td>
                  <td className="py-2 text-right font-semibold">
                    {formatCurrency(totalService)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Phụ tùng đã sử dụng */}
      {partRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Phụ tùng đã sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left">Phụ tùng</th>
                  <th className="py-2 text-right">SL</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-right">Thành tiền</th>
 
                </tr>
              </thead>
              <tbody>
                {partRows.map((p) => {
                  const sub = (p as any).SubTotal
                  const calc = (p.Quantity || 0) * (p.UnitPrice || 0)
                  const lineTotal = Number(sub != null ? sub : calc)
                  const suggested = !!(p as any).SuggestedByTech
                  const approved = !!(p as any).ApprovedByStaff
                  return (
                    <tr key={p.UsageID} className="border-b last:border-0">
                      <td className="py-2">{p.PartName}</td>
                      <td className="py-2 text-right">{p.Quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(p.UnitPrice)}</td>
                      <td className="py-2 text-right">{formatCurrency(lineTotal)}</td>
                      
                      
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="py-2 text-right font-semibold">
                    Tổng tiền phụ tùng
                  </td>
                  <td className="py-2 text-right font-semibold">
                    {formatCurrency(totalParts)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tổng cộng WorkOrder */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng cộng WorkOrder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Tổng dịch vụ</span>
            <span className="font-semibold">{formatCurrency(totalService)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tổng phụ tùng</span>
            <span className="font-semibold">{formatCurrency(totalParts)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Thành tiền dự kiến</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          {hasInvoice && (
            <p className="text-xs text-muted-foreground mt-1">
              Số tiền chính thức sẽ căn cứ theo hóa đơn được xuất bởi nhân viên.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Thanh toán */}
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán</CardTitle>
          <CardDescription>
            Hóa đơn chỉ xuất hiện và cho phép thanh toán khi công việc đã hoàn tất.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!hasInvoice && (
            <p className="text-muted-foreground">
              Công việc này hiện chưa có hóa đơn. Hóa đơn sẽ được tạo sau khi kỹ thuật viên hoàn
              tất và nhân viên xác nhận.
            </p>
          )}

          {hasInvoice && !canPay && (
            <p className="text-amber-600">
              Hóa đơn đã được tạo nhưng công việc chưa ở trạng thái <b>Done/Completed</b>, nên chưa
              thể thanh toán.
            </p>
          )}

          {hasInvoice && (
            <div className="flex gap-3 pt-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/user/progress")}
                className="flex-1"
              >
                Quay lại tiến độ
              </Button>
              <Button
                type="button"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                disabled={!canPay}
                onClick={() => router.push(`/user/payment?invoiceId=${invoiceId}`)}
              >
                {canPay ? "Thanh toán hóa đơn này" : "Chưa thể thanh toán"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
