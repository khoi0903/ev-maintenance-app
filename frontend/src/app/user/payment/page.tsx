'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Service, Invoice } from '@/types/entities'
import { userService } from '@/services/user.service'

const USE_PAYMENT_MOCK = process.env.NEXT_PUBLIC_PAYMENT_MOCK === 'true'

type LocalTxn = {
  id: string
  invoiceId: number
  status: 'Pending' | 'Success' | 'Failed'
  amount: number
  method: string
  createdAt: string
}

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const serviceIdParam = searchParams.get('serviceId')
  const appointmentIdParam = searchParams.get('appointmentId')
  const invoiceIdParam = searchParams.get('invoiceId')

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(
    serviceIdParam ? Number(serviceIdParam) : null
  )
  const [appointmentId, setAppointmentId] = useState<number | null>(
    appointmentIdParam ? Number(appointmentIdParam) : null
  )

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  // pendingTxn từ API (VNPAY / QR)
  const [pendingTxn, setPendingTxn] = useState<{
    transactionId: number
    status: string
    amount: number
    method: string
    updatedAt?: string
  } | null>(null)

  // pending do chính khách bấm "Tôi đã chuyển khoản"
  const [clientPending, setClientPending] = useState(false)

  // lịch sử giao dịch local cho invoice hiện tại
  const [localTxns, setLocalTxns] = useState<LocalTxn[]>([])

  // list hóa đơn của user
  const [myInvoices, setMyInvoices] = useState<Invoice[]>([])
  const [myInvoicesLoading, setMyInvoicesLoading] = useState(false)

  const [requestedInvoiceId, setRequestedInvoiceId] = useState<number | null>(
    invoiceIdParam ? Number(invoiceIdParam) : null
  )
  const [invoiceLookup, setInvoiceLookup] = useState(invoiceIdParam || '')

  const isMocking = USE_PAYMENT_MOCK

  // ✅ trạng thái WorkOrder gắn với invoice (nếu có)
  const [workOrder, setWorkOrder] = useState<any | null>(null)
  const [workOrderLoading, setWorkOrderLoading] = useState(false)

  // ========== MOCK invoice (demo) ==========
  const buildMockInvoice = useCallback((): Invoice | null => {
    if (!selectedService) return null
    const total = Number((selectedService as any).StandardCost || 0)
    const now = new Date().toISOString()
    return {
      InvoiceID: requestedInvoiceId ?? appointmentId ?? -Date.now(),
      AppointmentID: appointmentId ?? null,
      WorkOrderID: null,
      TotalAmount: total,
      PaymentStatus: 'Unpaid',
      CreatedAt: now,
      UpdatedAt: now,
      customerName: 'Khách hàng demo',
      licensePlate: undefined,
      vin: undefined,
    } as any
  }, [appointmentId, requestedInvoiceId, selectedService])

  // ========== Fallback từ sessionStorage ==========
  useEffect(() => {
    try {
      const tmpStr = sessionStorage.getItem('tempAppointment')
      if (tmpStr) {
        const tmp = JSON.parse(tmpStr)
        if (!serviceId) setServiceId(Number(tmp?.ServiceID || tmp?.serviceId))
        if (!appointmentId) setAppointmentId(Number(tmp?.AppointmentID || tmp?.appointmentId))
        if (!requestedInvoiceId && tmp?.InvoiceID) setRequestedInvoiceId(Number(tmp.InvoiceID))
      }
      if (!serviceId) {
        const svcStr = sessionStorage.getItem('selectedService')
        if (svcStr) {
          const svc = JSON.parse(svcStr)
          if (svc?.ServiceID || svc?.serviceId) {
            setServiceId(Number(svc.ServiceID || svc.serviceId))
          }
        }
      }
      if (!requestedInvoiceId) {
        const storedInvoice = sessionStorage.getItem('lastInvoiceId')
        if (storedInvoice) {
          const parsed = Number(storedInvoice)
          if (!Number.isNaN(parsed)) setRequestedInvoiceId(parsed)
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // đồng bộ invoiceId từ URL
  useEffect(() => {
    if (!invoiceIdParam) return
    const parsed = Number(invoiceIdParam)
    if (!Number.isNaN(parsed)) setRequestedInvoiceId(parsed)
  }, [invoiceIdParam])

  // ========== Load dịch vụ ==========
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        let sid = serviceId
        if (!sid) {
          const tmpStr = sessionStorage.getItem('tempAppointment')
          if (tmpStr) {
            const tmp = JSON.parse(tmpStr)
            sid = Number(tmp?.ServiceID || tmp?.serviceId)
            setServiceId(sid || null)
          }
        }
        if (!sid) {
          setLoading(false)
          return
        }
        const res = await userService.getServiceById(sid)
        if (res?.success) setSelectedService(res.data)
      } catch (e: any) {
        setError(e?.message || 'Không tải được dịch vụ')
      } finally {
        setLoading(false)
      }
    })()
  }, [serviceId])

  // ========== Load invoice + pending theo APPOINTMENT ==========
  useEffect(() => {
    if (isMocking) return
    if (!appointmentId) return

    // Nếu đã có requestedInvoiceId (đang xem invoice cụ thể) thì không override nữa
    if (requestedInvoiceId) return

    let active = true
    ;(async () => {
      try {
        const res = await userService.getPaymentInfoByAppointment({
          appointmentId: Number(appointmentId),
          serviceId: serviceId ?? undefined,
        })
        if (!active) return
        if (res?.success) {
          const info = res.data as any
          if (info?.invoice) {
            setInvoice(info.invoice)
            sessionStorage.setItem('lastInvoiceId', String(info.invoice.InvoiceID))
          } else if (!invoice) {
            setInvoice(null)
          }
          if (info?.pending) setPendingTxn(info.pending)
          else setPendingTxn(null)
        } else {
          if (!invoice) setInvoice(null)
          setPendingTxn(null)
          setError(res?.error?.message || 'Không thể tải thông tin thanh toán')
        }
      } catch (err: any) {
        if (!active) return
        if (!invoice) setInvoice(null)
        setPendingTxn(null)
        setError(err?.message || 'Không thể tải thông tin thanh toán')
      }
    })()
    return () => {
      active = false
    }
  }, [appointmentId, serviceId, isMocking, requestedInvoiceId])

  // ========== Load invoice cụ thể theo requestedInvoiceId ==========
  useEffect(() => {
    if (isMocking) {
      setInvoiceLoading(false)
      return
    }
    if (!requestedInvoiceId) return
    let active = true
    ;(async () => {
      try {
        setInvoiceLoading(true)
        const res = await userService.getInvoiceById(Number(requestedInvoiceId))
        if (!active) return
        if (res?.success) {
          const inv = res.data as Invoice
          setInvoice(inv)
          sessionStorage.setItem('lastInvoiceId', String(inv.InvoiceID))
          if (inv.AppointmentID && !appointmentId) {
            setAppointmentId(inv.AppointmentID)
          }
        } else {
          setInvoice(null)
          setError(res?.error?.message || 'Không thể tải hóa đơn')
        }
      } catch (err: any) {
        if (!active) return
        setInvoice(null)
        setError(err?.message || 'Không thể tải hóa đơn')
      } finally {
        if (active) setInvoiceLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [requestedInvoiceId, appointmentId, isMocking])

  // ========== MOCK invoice ==========
  useEffect(() => {
    if (!isMocking) return
    if (!selectedService) return
    setInvoice(prev => prev ?? buildMockInvoice())
    setLoading(false)
  }, [buildMockInvoice, isMocking, selectedService])

  // ✅ Load WorkOrder liên quan (nếu invoice có WorkOrderID)
  useEffect(() => {
    if (isMocking) return
    if (!invoice?.WorkOrderID) return

    let active = true
    ;(async () => {
      try {
        setWorkOrderLoading(true)
        const res = await userService.getMyWorkOrderDetail(invoice.WorkOrderID as any)
        if (!active) return
        if (res?.success) {
          setWorkOrder(res.data)
        } else {
          setWorkOrder(null)
        }
      } catch {
        if (!active) return
        setWorkOrder(null)
      } finally {
        if (active) setWorkOrderLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [invoice?.WorkOrderID, isMocking])

  const workOrderStatus = useMemo(() => {
    if (!workOrder) return null
    return (
      (workOrder as any).Status ||
      (workOrder as any).ProgressStatus ||
      null
    )
  }, [workOrder])

  // ✅ Chỉ cho thanh toán khi WorkOrder (nếu có) đã Done / Completed
  const isWorkOrderDone = useMemo(() => {
    if (!invoice?.WorkOrderID) {
      // invoice không gắn WorkOrder thì không áp rule
      return true
    }
    if (!workOrderStatus) return false
    return workOrderStatus === 'Done' || workOrderStatus === 'Completed'
  }, [invoice?.WorkOrderID, workOrderStatus])

  // ========== Load lịch sử giao dịch local cho invoice hiện tại ==========
  useEffect(() => {
    if (!invoice?.InvoiceID) return
    try {
      const raw = localStorage.getItem('ev_payment_history') || '[]'
      const all: LocalTxn[] = JSON.parse(raw)
      setLocalTxns(all.filter(t => t.invoiceId === invoice.InvoiceID))
      const hasPending = all.some(
        t => t.invoiceId === invoice.InvoiceID && t.status === 'Pending'
      )
      setClientPending(hasPending)
    } catch {
      setLocalTxns([])
    }
  }, [invoice?.InvoiceID])

  // ========== Load list hóa đơn của user ==========
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setMyInvoicesLoading(true)
        const res = await userService.myInvoices()
        if (!alive) return
        if (res?.success && Array.isArray(res.data)) {
          setMyInvoices(res.data)
        } else {
          setMyInvoices([])
        }
      } catch {
        if (!alive) return
        setMyInvoices([])
      } finally {
        if (alive) setMyInvoicesLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const unpaidInvoices = useMemo(
    () =>
      myInvoices.filter(inv => {
        if (inv.PaymentStatus !== 'Unpaid') return false
        if (clientPending && invoice && inv.InvoiceID === invoice.InvoiceID) return false
        return true
      }),
    [myInvoices, clientPending, invoice]
  )

  // 💚 lịch sử hóa đơn đã hoàn thành (Paid)
  const paidInvoices = useMemo(
    () => myInvoices.filter(inv => inv.PaymentStatus === 'Paid'),
    [myInvoices]
  )

  // ========== Lookup bằng mã invoice ==========
  const handleInvoiceLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceLookup) return
    const parsed = Number(invoiceLookup)
    if (Number.isNaN(parsed)) {
      setError('Mã hóa đơn không hợp lệ')
      return
    }
    setError(null)
    setRequestedInvoiceId(parsed)
  }

  const amountDue = useMemo(() => {
    if (invoice && (invoice as any).TotalAmount != null) {
      return Number((invoice as any).TotalAmount || 0)
    }
    if (selectedService) {
      return Number((selectedService as any).StandardCost || 0)
    }
    return 0
  }, [invoice, selectedService])

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)

  const canConfirmPayment = useMemo(() => {
    if (!invoice || amountDue <= 0) return false
    if ((invoice as any).PaymentStatus === 'Paid') return false
    if (clientPending) return false
    if (pendingTxn && pendingTxn.status === 'Pending') return false
    // ✅ thêm điều kiện WorkOrder phải Done/Completed (nếu có)
    if (!isWorkOrderDone) return false
    return true
  }, [amountDue, invoice, clientPending, pendingTxn, isWorkOrderDone])

  // ========== Lưu lịch sử local ==========
  const appendLocalTxn = (data: {
    status: 'Pending' | 'Success' | 'Failed'
    amount: number
    method: string
  }) => {
    if (!invoice?.InvoiceID) return
    const txn: LocalTxn = {
      id: `${invoice.InvoiceID}-${Date.now()}`,
      invoiceId: invoice.InvoiceID,
      status: data.status,
      amount: data.amount,
      method: data.method,
      createdAt: new Date().toISOString(),
    }
    try {
      const raw = localStorage.getItem('ev_payment_history') || '[]'
      const all: LocalTxn[] = JSON.parse(raw)
      const updated = [...all, txn]
      localStorage.setItem('ev_payment_history', JSON.stringify(updated))
      setLocalTxns(updated.filter(t => t.invoiceId === invoice.InvoiceID))
    } catch {
      setLocalTxns(prev => [...prev, txn])
    }
  }

  // ========== Khi hóa đơn đã Paid thì tự thêm bản ghi "Success" ==========
  useEffect(() => {
    if (!invoice?.InvoiceID) return
    if ((invoice as any).PaymentStatus !== 'Paid') return

    const hasSuccess = localTxns.some(t => t.status === 'Success')
    if (hasSuccess) return

    appendLocalTxn({
      status: 'Success',
      amount: amountDue,
      method: 'Chuyển khoản ngân hàng',
    })
  }, [invoice, amountDue, localTxns])

  // ========== “Tôi đã chuyển khoản” ==========
  const handleConfirmPayment = async () => {
    if (!invoice) {
      setError('Không tìm thấy hóa đơn để thanh toán')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const res = await userService.confirmInvoicePaid(invoice.InvoiceID)
      if (!res?.success) {
        throw new Error(
          (res as any)?.message ||
            (res as any)?.error?.message ||
            'Không thể gửi yêu cầu thanh toán'
        )
      }

      setClientPending(true)
      appendLocalTxn({
        status: 'Pending',
        amount: amountDue,
        method: 'Chuyển khoản ngân hàng',
      })
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi yêu cầu thanh toán')
    } finally {
      setProcessing(false)
    }
  }

  if (loading || invoiceLoading || workOrderLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Đang tải...</p>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Thanh Toán Dịch Vụ</h1>
        {invoice ? (
          <p className="text-muted-foreground mt-2">
            Hóa đơn #{invoice.InvoiceID} – Số tiền cần thanh toán:{' '}
            <b>{formatCurrency(amountDue)}</b>
          </p>
        ) : (
          <p className="text-muted-foreground mt-2">
            Hóa đơn sẽ xuất hiện sau khi kỹ thuật viên hoàn tất công việc và nhân viên gửi yêu cầu
            thanh toán.
          </p>
        )}

        {invoice && (
          <>
            <p className="text-xs mt-1">
              Trạng thái hóa đơn:{' '}
              <span className="font-semibold">
                {(invoice as any).PaymentStatus === 'Paid'
                  ? clientPending
                    ? 'Đã gửi yêu cầu, đang chờ nhân viên xác nhận'
                    : 'Đã thanh toán'
                  : clientPending || (pendingTxn && pendingTxn.status === 'Pending')
                  ? 'Khách đã chuyển khoản, chờ xác nhận'
                  : 'Chưa thanh toán'}
              </span>
            </p>

            {invoice.WorkOrderID && (
              <>
                <p className="text-xs mt-1">
                  WorkOrder liên quan: #{invoice.WorkOrderID} –{' '}
                  <span className="font-semibold">
                    {workOrderStatus ?? 'Đang tải trạng thái...'}
                  </span>
                </p>
                {!isWorkOrderDone && (
                  <p className="text-xs text-amber-600 mt-1">
                    Chỉ khi công việc đã <b>Done / Completed</b> bạn mới có thể xác nhận đã
                    chuyển khoản.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Lookup invoice nếu chưa có */}
      {!requestedInvoiceId && (
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm">
            <p className="text-muted-foreground">
              Vui lòng nhập mã hóa đơn do nhân viên gửi (hoặc mở đường link kèm theo) để bắt đầu
              thanh toán.
            </p>
            <form
              onSubmit={handleInvoiceLookupSubmit}
              className="flex flex-col gap-3 md:flex-row"
            >
              <Input
                placeholder="Nhập mã hóa đơn"
                value={invoiceLookup}
                onChange={e => setInvoiceLookup(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="md:w-[200px]">
                Tải hóa đơn
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ERROR */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10">
          <CardContent className="pt-4">
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Chưa có invoice */}
      {!invoice && !invoiceLoading && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="pt-4 text-sm text-amber-700 dark:text-amber-200">
            <p className="font-semibold mb-1">Chưa tìm thấy hóa đơn</p>
            <p>
              Hóa đơn chỉ được tạo sau khi kỹ thuật viên hoàn tất công việc và nhân viên xác nhận.
            </p>
            <p className="mt-1">
              Nếu bạn đã nhận được mã hóa đơn, hãy nhập phía trên để tải lại. Nếu chưa, vui lòng
              chờ thông báo từ nhân viên hỗ trợ.
            </p>
          </CardContent>
        </Card>
      )}

      {/* pendingTxn từ server (VNPAY/QR) */}
      {pendingTxn && pendingTxn.status === 'Pending' && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="pt-4 text-sm text-amber-700 dark:text-amber-200">
            <p className="font-semibold mb-1">Bạn đang có giao dịch chờ xác nhận</p>
            <p>
              Mã giao dịch: {pendingTxn.transactionId} • Số tiền:{' '}
              {formatCurrency(pendingTxn.amount)}
            </p>
            <p className="mt-1">
              Nếu đã thanh toán, vui lòng chờ hệ thống cập nhật hoặc thử lại.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Thông tin dịch vụ / hóa đơn */}
      {(selectedService || invoice) && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Thông tin Dịch vụ / Hóa đơn
            </CardTitle>
            <CardDescription>
              Chi tiết dịch vụ sẽ căn cứ trên hóa đơn được gửi cho bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Tên dịch vụ:</span>
                <p className="text-lg font-semibold">
                  {selectedService?.ServiceName ||
                    (invoice as any)?.ServiceName ||
                    'Dịch vụ EV Maintenance'}
                </p>
              </div>
              {selectedService?.Description && (
                <div>
                  <span className="text-sm text-muted-foreground">Mô tả:</span>
                  <p className="text-sm">{selectedService.Description}</p>
                </div>
              )}
              <div className="flex justify-between text-lg border-t pt-3">
                <span>Số tiền trên hóa đơn</span>
                <b className="text-green-600 dark:text-green-500">
                  {formatCurrency(amountDue)}
                </b>
              </div>
              {invoice && (
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>Mã hóa đơn</span>
                  <span className="font-medium">#{invoice.InvoiceID}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thông tin chuyển khoản */}
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán qua tài khoản ngân hàng</CardTitle>
          <CardDescription>
            Vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống đối chiếu hóa đơn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="bg-white dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
            <p className="font-semibold text-green-700 dark:text-green-300 mb-2">
              Thông tin chuyển khoản
            </p>
            <ul className="space-y-1 text-gray-700 dark:text-gray-100">
              <li>• Ngân hàng: <b>TP Bank</b></li>
              <li>• Chủ tài khoản: <b>Trung Tâm EVM</b></li>
              <li>• Số tài khoản: <b>10702294403</b></li>
              <li>
                • Nội dung chuyển khoản:{' '}
                <b>{invoice ? `EV-${invoice.InvoiceID}-KH` : 'EV-[MÃ HÓA ĐƠN]-KH'}</b>
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground">
            Sau khi chuyển khoản thành công, nhấn nút xác nhận bên dưới. Nhân viên sẽ đối chiếu
            và hoàn tất biên nhận cho bạn.
          </p>
        </CardContent>
      </Card>

      {/* Xác nhận thanh toán */}
      <Card>
        <CardHeader>
          <CardTitle>Xác nhận thanh toán</CardTitle>
          <CardDescription>
            Kiểm tra lại thông tin trước khi xác nhận đã chuyển khoản.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 pt-4 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/user/progress')}
              className="flex-1"
              disabled={processing}
            >
              Quay lại tiến độ
            </Button>
            <Button
              type="button"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              disabled={processing || !canConfirmPayment}
              onClick={handleConfirmPayment}
            >
              {processing
                ? 'Đang gửi yêu cầu...'
                : !isWorkOrderDone && invoice?.WorkOrderID
                ? 'Công việc chưa hoàn tất'
                : clientPending
                ? 'Đã gửi yêu cầu, chờ xác nhận'
                : 'Tôi đã chuyển khoản'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lịch sử giao dịch cho invoice hiện tại */}
      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch cho hóa đơn #{invoice.InvoiceID}</CardTitle>
            <CardDescription>
              Các lần bạn đã bấm “Tôi đã chuyển khoản” trên trình duyệt này, và trạng thái thanh toán.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {localTxns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có giao dịch nào được ghi nhận trên trình duyệt này.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {localTxns
                  .slice()
                  .reverse()
                  .map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-b last:border-b-0 py-1"
                    >
                      <div>
                        <div className="font-medium">
                          {tx.status === 'Pending'
                            ? 'Đã gửi yêu cầu chuyển khoản'
                            : tx.status === 'Success'
                            ? 'Thanh toán thành công'
                            : 'Thanh toán thất bại'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(tx.amount)}</div>
                        <div className="text-xs text-muted-foreground">{tx.method}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 💚 Lịch sử hóa đơn đã hoàn thành (Paid) */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử hóa đơn đã thanh toán</CardTitle>
          <CardDescription>
            Danh sách các hoá đơn ở trạng thái <b>Paid</b> của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myInvoicesLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải lịch sử hóa đơn...</p>
          ) : paidInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bạn chưa có hóa đơn nào ở trạng thái <b>Paid</b>.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {paidInvoices
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.UpdatedAt || b.CreatedAt || '').getTime() -
                    new Date(a.UpdatedAt || a.CreatedAt || '').getTime()
                )
                .map(inv => (
                  <div
                    key={inv.InvoiceID}
                    className="flex items-center justify-between border-b last:border-b-0 py-1"
                  >
                    <div>
                      <div className="font-medium">Hóa đơn #{inv.InvoiceID}</div>
                      <div className="text-xs text-muted-foreground">
                        Hoàn thành:{' '}
                        {inv.UpdatedAt
                          ? new Date(inv.UpdatedAt as any).toLocaleString('vi-VN')
                          : inv.CreatedAt
                          ? new Date(inv.CreatedAt as any).toLocaleString('vi-VN')
                          : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency((inv as any).TotalAmount || 0)}
                      </div>
                      <div className="text-xs text-green-600 font-semibold">Paid</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Các hóa đơn chưa thanh toán khác */}
      <Card>
        <CardHeader>
          <CardTitle>Các hóa đơn chưa thanh toán khác</CardTitle>
          <CardDescription>
            Bạn có thể chọn một hóa đơn khác để thanh toán.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myInvoicesLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách hóa đơn...</p>
          ) : unpaidInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Hiện tại bạn không có hóa đơn nào đang ở trạng thái <b>Unpaid</b>.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {unpaidInvoices.map(inv => (
                <div
                  key={inv.InvoiceID}
                  className="flex items-center justify-between border-b last:border-b-0 py-1"
                >
                  <div>
                    <div className="font-medium">Hóa đơn #{inv.InvoiceID}</div>
                    <div className="text-xs text-muted-foreground">
                      Ngày tạo:{' '}
                      {inv.CreatedAt
                        ? new Date(inv.CreatedAt as any).toLocaleString('vi-VN')
                        : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency((inv as any).TotalAmount || 0)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/user/payment?invoiceId=${inv.InvoiceID}`)
                      }
                    >
                      Thanh toán
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
