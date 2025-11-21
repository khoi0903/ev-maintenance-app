'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { adminService } from '@/services/admin.service'
import type { Invoice, PaymentTransaction } from '@/types/entities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function FinancialPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [invoiceStatus, setInvoiceStatus] = useState<string>('All')
  const [paymentStatus, setPaymentStatus] = useState<string>('All')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [paymentSearch, setPaymentSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<number | null>(null)

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [invRes, payRes] = await Promise.all([
        adminService.listInvoices(invoiceStatus === 'All' ? '' : `?status=${invoiceStatus}`),
        adminService.listPayments(paymentStatus === 'All' ? '' : `?status=${paymentStatus}`),
      ])
      if (invRes.success) setInvoices(invRes.data as Invoice[])
      else setError(invRes.error?.message || 'Không thể tải hóa đơn')

      if (payRes.success) setPayments(payRes.data as PaymentTransaction[])
      else setError((prev) => prev ?? payRes.error?.message ?? 'Không thể tải giao dịch thanh toán')
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Không thể tải dữ liệu tài chính')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
  }, [invoiceStatus, paymentStatus])

  const filteredInvoices = useMemo(() => {
    const keyword = invoiceSearch.trim().toLowerCase()
    return invoices.filter((inv) => {
      const invoiceId = inv.InvoiceID ?? (inv as any).invoiceId
      const appointmentId = inv.AppointmentID ?? (inv as any).appointmentId
      const customer = (inv.customerName ?? (inv as any).CustomerName ?? '').toLowerCase()
      const licensePlate = (inv.licensePlate ?? (inv as any).LicensePlate ?? '').toLowerCase()
      const matchesKeyword =
        !keyword ||
        String(invoiceId).includes(keyword) ||
        String(appointmentId ?? '').includes(keyword) ||
        customer.includes(keyword) ||
        licensePlate.includes(keyword)
      return matchesKeyword
    })
  }, [invoices, invoiceSearch])

  const filteredPayments = useMemo(() => {
    const keyword = paymentSearch.trim().toLowerCase()
    return payments.filter((txn) => {
      const transactionId = txn.TransactionID ?? (txn as any).transactionId
      const invoiceId = txn.InvoiceID ?? (txn as any).invoiceId
      const customer = (txn.customerName ?? (txn as any).CustomerName ?? '').toLowerCase()
      const matchesKeyword =
        !keyword ||
        String(transactionId).includes(keyword) ||
        String(invoiceId).includes(keyword) ||
        customer.includes(keyword)
      return matchesKeyword
    })
  }, [payments, paymentSearch])

  const sumInvoices = filteredInvoices.reduce(
    (total, inv) => total + Number(inv.TotalAmount ?? (inv as any).totalAmount ?? 0),
    0
  )
  const sumPayments = filteredPayments.reduce(
    (total, txn) => total + Number(txn.Amount ?? (txn as any).amount ?? 0),
    0
  )

  const markInvoice = async (id: number, paid: boolean) => {
    try {
      setUpdatingInvoiceId(id)
      const res = paid ? await adminService.markInvoicePaid(id) : await adminService.markInvoiceUnpaid(id)
      if (!res.success) {
        setError(res.error?.message || 'Không thể cập nhật trạng thái hóa đơn')
      } else {
        await fetchFinancialData()
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể cập nhật trạng thái hóa đơn')
    } finally {
      setUpdatingInvoiceId(null)
    }
  }

  return (
    <div className="space-y-8">
        <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground mt-2">
          Giám sát hoá đơn và giao dịch thanh toán để giải quyết tranh chấp hoặc xác nhận doanh thu.
          </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hoá đơn dịch vụ</CardTitle>
          <CardDescription>Danh sách hoá đơn được tạo theo lịch hẹn và phiếu công việc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Tìm theo ID, khách hàng, biển số..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
            />
          <select
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
          </select>
            <div className="text-sm text-muted-foreground flex items-center">
              Tổng tiền:{" "}
              <span className="ml-2 font-medium text-foreground">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sumInvoices)}
              </span>
        </div>
      </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Xe</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
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
                {!loading && filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      Không có hoá đơn nào phù hợp.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.InvoiceID}>
                      <TableCell className="font-medium">#{inv.InvoiceID ?? (inv as any).invoiceId}</TableCell>
                      <TableCell>APT #{inv.AppointmentID ?? (inv as any).appointmentId ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {inv.customerName || (inv as any).CustomerName || '—'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {inv.customerPhone || (inv as any).CustomerPhone || ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{inv.licensePlate || (inv as any).LicensePlate || '—'}</span>
                          <span className="text-xs text-muted-foreground">{inv.vin || (inv as any).VIN || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          Number(inv.TotalAmount ?? (inv as any).totalAmount ?? 0)
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            (inv.PaymentStatus ?? (inv as any).paymentStatus) === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {inv.PaymentStatus ?? (inv as any).paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.CreatedAt
                          ? new Date(inv.CreatedAt).toLocaleString('vi-VN')
                          : (inv as any).createdAt
                          ? new Date((inv as any).createdAt).toLocaleString('vi-VN')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markInvoice(inv.InvoiceID, true)}
                            disabled={
                              updatingInvoiceId === (inv.InvoiceID ?? (inv as any).invoiceId) ||
                              (inv.PaymentStatus ?? (inv as any).paymentStatus) === 'Paid'
                            }
                          >
                            Đánh dấu Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markInvoice(inv.InvoiceID, false)}
                            disabled={
                              updatingInvoiceId === (inv.InvoiceID ?? (inv as any).invoiceId) ||
                              (inv.PaymentStatus ?? (inv as any).paymentStatus) === 'Unpaid'
                            }
                          >
                            Đánh dấu Unpaid
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giao dịch thanh toán</CardTitle>
          <CardDescription>
            Lịch sử thanh toán qua các kênh (VNPay, eWallet, Banking...) để kiểm tra tranh chấp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Tìm theo mã giao dịch hoặc khách hàng..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
            />
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
            <div className="text-sm text-muted-foreground flex items-center">
              Tổng giao dịch:
              <span className="ml-2 font-medium text-foreground">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sumPayments)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Txn #</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      Không có giao dịch nào phù hợp.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredPayments.map((txn) => (
                    <TableRow key={txn.TransactionID ?? (txn as any).transactionId}>
                      <TableCell className="font-medium">#{txn.TransactionID ?? (txn as any).transactionId}</TableCell>
                      <TableCell>INV #{txn.InvoiceID ?? (txn as any).invoiceId}</TableCell>
                      <TableCell>{txn.customerName || (txn as any).CustomerName || '—'}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{txn.Method ?? (txn as any).method}</span>
                          {(txn.BankCode ?? (txn as any).BankCode) && (
                            <span className="text-xs text-muted-foreground">
                              Bank: {txn.BankCode ?? (txn as any).BankCode}
                            </span>
                          )}
            </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            (txn.Status ?? (txn as any).status) === 'Success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : (txn.Status ?? (txn as any).status) === 'Failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {txn.Status ?? (txn as any).status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          Number(txn.Amount ?? (txn as any).amount ?? 0)
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {txn.CreatedAt
                          ? new Date(txn.CreatedAt).toLocaleString('vi-VN')
                          : (txn as any).createdAt
                          ? new Date((txn as any).createdAt).toLocaleString('vi-VN')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
