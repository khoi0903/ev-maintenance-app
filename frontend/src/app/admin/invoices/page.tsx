'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/admin.service'
import type { Invoice } from '@/types/entities'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
}

export default function InvoicesPage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
  const [showCompletedOnly, setShowCompletedOnly] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchInvoices = async (status?: string) => {
    try {
      setLoading(true)
      setError(null)
      // Fetch all invoices, then filter for completed work orders on frontend
      const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''
      const res = await adminService.listInvoices(query)
      if (res.success) {
        const apiInvoices = (res.data as Invoice[]) || []
        console.log('[Invoices] Received invoices from API:', apiInvoices.length)
        console.log('[Invoices] Sample invoice data:', apiInvoices[0])
        setAllInvoices(apiInvoices)
      } else {
        setError(res.error?.message || 'Không thể tải hóa đơn')
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Không thể tải hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices(statusFilter)
  }, [statusFilter])

  const handleMarkPaid = async (id: number) => {
    try {
      setUpdatingId(id)
      setError(null)
      const res = await adminService.markInvoicePaid(id)
      if (res.success) {
        await fetchInvoices(statusFilter)
      } else {
        setError(res.error?.message || 'Không thể cập nhật trạng thái')
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Không thể cập nhật trạng thái')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleMarkUnpaid = async (id: number) => {
    try {
      setUpdatingId(id)
      setError(null)
      const res = await adminService.markInvoiceUnpaid(id)
      if (res.success) {
        await fetchInvoices(statusFilter)
      } else {
        setError(res.error?.message || 'Không thể cập nhật trạng thái')
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Không thể cập nhật trạng thái')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSendInvoice = async (inv: Invoice) => {
    const customerEmail = (inv as any).CustomerEmail
    const customerPhone = (inv as any).CustomerPhone
    const customerName = (inv as any).CustomerName
    
    if (!customerEmail && !customerPhone) {
      alert('Khách hàng chưa có email hoặc số điện thoại để gửi hóa đơn')
      return
    }

    // Tạo nội dung hóa đơn
    const invoiceContent = `
HÓA ĐƠN DỊCH VỤ BẢO DƯỠNG XE ĐIỆN

Mã hóa đơn: #${inv.InvoiceID}
Khách hàng: ${customerName}
Số điện thoại: ${customerPhone || '—'}
Email: ${customerEmail || '—'}

Thông tin xe:
- Biển số: ${(inv as any).LicensePlate || '—'}
- VIN: ${(inv as any).VIN || '—'}

Tổng tiền: ${formatCurrency(inv.TotalAmount)}

Ngày tạo: ${formatDate(inv.CreatedAt)}

Vui lòng thanh toán hóa đơn này để hoàn tất dịch vụ.
    `.trim()

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(invoiceContent)
      alert('Đã sao chép nội dung hóa đơn vào clipboard!\n\nBạn có thể:\n1. Gửi email cho khách hàng\n2. Gửi tin nhắn qua số điện thoại\n3. In hóa đơn')
    } catch (err) {
      // Fallback: show in alert
      alert(`Nội dung hóa đơn:\n\n${invoiceContent}\n\nVui lòng sao chép và gửi cho khách hàng.`)
    }

    if (!inv.InvoiceID) return

    try {
      setUpdatingId(inv.InvoiceID)
      setError(null)
      const res = await adminService.sendInvoiceToCustomer(inv.InvoiceID)
      if (res.success) {
        alert('Đã ghi nhận việc gửi hóa đơn. Khách hàng sẽ nhận được thông báo thanh toán.')
        await fetchInvoices(statusFilter)
      } else {
        setError(res.error?.message || 'Không thể cập nhật trạng thái gửi hóa đơn')
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Không thể cập nhật trạng thái gửi hóa đơn')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('vi-VN')
    } catch {
      return dateStr
    }
  }

  const invoices = useMemo(() => {
    if (!showCompletedOnly) return allInvoices
    const completed = allInvoices.filter((inv: any) => {
      const woStatus = inv.WorkOrderStatus
      const isCompleted = woStatus === 'Completed' || woStatus === 'Done'
      console.log(`[Invoices] Invoice #${inv.InvoiceID}: WorkOrderStatus=${woStatus || 'null'}, Completed=${isCompleted}`)
      return isCompleted
    })
    console.log('[Invoices] Completed invoices:', completed.length)
    return completed
  }, [allInvoices, showCompletedOnly])

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices
    const term = searchTerm.toLowerCase()
    return invoices.filter(
      (inv) =>
        String(inv.InvoiceID || '').toLowerCase().includes(term) ||
        (inv as any).CustomerName?.toLowerCase().includes(term) ||
        (inv as any).CustomerPhone?.toLowerCase().includes(term) ||
        (inv as any).LicensePlate?.toLowerCase().includes(term) ||
        (inv as any).VIN?.toLowerCase().includes(term)
    )
  }, [invoices, searchTerm])

  const unpaidCount = invoices.filter((inv) => inv.PaymentStatus === 'Unpaid').length
  const paidCount = invoices.filter((inv) => inv.PaymentStatus === 'Paid').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Hóa đơn</h1>
        <p className="text-muted-foreground mt-2">
          Hóa đơn cuối cùng sau khi technician hoàn thành dịch vụ. Gửi hóa đơn cho khách hàng để thực hiện thanh toán.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10">
          <CardContent className="pt-4">
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng số hóa đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Chưa thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unpaidCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Hóa đơn</CardTitle>
          <CardDescription>Lọc và tìm kiếm hóa đơn</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input
              placeholder="Tìm kiếm theo ID, tên khách hàng, SĐT, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Unpaid">Chưa thanh toán</option>
              <option value="Paid">Đã thanh toán</option>
              <option value="Partial">Thanh toán một phần</option>
            </select>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  id="completed-only"
                  type="checkbox"
                  checked={showCompletedOnly}
                  onChange={(e) => setShowCompletedOnly(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="completed-only">
                  Chỉ hiển thị hóa đơn đã hoàn thành
                </label>
              </div>
          </div>

          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Đang tải...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Không tìm thấy hóa đơn nào' : 'Chưa có hóa đơn nào đã hoàn thành. Hóa đơn sẽ xuất hiện sau khi technician hoàn thành dịch vụ.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Xe</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.InvoiceID}>
                    <TableCell className="font-medium">#{inv.InvoiceID}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{(inv as any).CustomerName || '—'}</span>
                        <span className="text-xs text-muted-foreground">
                          {(inv as any).CustomerPhone || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{(inv as any).LicensePlate || '—'}</span>
                        <span className="text-xs text-muted-foreground">
                          VIN: {(inv as any).VIN || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-lg">
                          {formatCurrency(inv.TotalAmount)}
                        </span>
                        {((inv as any).WorkOrderStatus === 'Completed' || (inv as any).WorkOrderStatus === 'Done') ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                            ✓ Tổng cuối cùng sau khi hoàn thành dịch vụ
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          STATUS_COLORS[inv.PaymentStatus || 'Unpaid']
                        )}
                      >
                        {inv.PaymentStatus === 'Unpaid' ? 'Chưa thanh toán' : inv.PaymentStatus === 'Paid' ? 'Đã thanh toán' : 'Một phần'}
                      </span>
                      {inv.PaymentStatus === 'Paid' && (inv as any).CustomerPaidAt && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Khách xác nhận: {formatDate((inv as any).CustomerPaidAt)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {((inv as any).WorkOrderStatus === 'Completed' || (inv as any).WorkOrderStatus === 'Done') ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          ✓ Hoàn thành
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(inv.CreatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {((inv as any).WorkOrderStatus === 'Completed' || (inv as any).WorkOrderStatus === 'Done') && inv.PaymentStatus === 'Unpaid' ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSendInvoice(inv)}
                              className="w-full"
                              disabled={updatingId === inv.InvoiceID}
                            >
                              📧 Gửi hóa đơn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkPaid(inv.InvoiceID!)}
                              disabled={updatingId === inv.InvoiceID}
                              className="w-full"
                            >
                              {updatingId === inv.InvoiceID ? 'Đang cập nhật...' : 'Đánh dấu đã thanh toán'}
                            </Button>
                          </>
                        ) : inv.PaymentStatus === 'Paid' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkUnpaid(inv.InvoiceID!)}
                            disabled={updatingId === inv.InvoiceID}
                            className="w-full"
                          >
                            {updatingId === inv.InvoiceID ? 'Đang cập nhật...' : 'Đánh dấu chưa thanh toán'}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

