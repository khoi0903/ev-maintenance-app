'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import type { Account } from '@/types/entities'

interface TableRow {
  id: string
  primary: string
  secondary: string
  category: string
  status: string
  amount?: string
}

interface UsersTableWidgetProps {
  config?: {
    pageSize?: number
    sortable?: boolean
    filterable?: boolean
    dataType?: 'users' | 'workorders' // Type of data to display
  }
  data?: any[]
  className?: string
}

/**
 * Users/WorkOrders Table Widget - Hiển thị bảng danh sách users hoặc work orders
 * Supports both user and work order data transformation
 *
 * @param config - Config cho widget (pageSize, sortable, filterable, dataType)
 * @param data - Data từ API (users or work orders)
 * @param className - Additional CSS classes
 */
export default function UsersTableWidget({
  config = {},
  data = [],
  className,
}: UsersTableWidgetProps) {
  const [records, setRecords] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { pageSize = 10, dataType = 'users' } = config

  const transformData = (rawData: any[]): TableRow[] => {
    if (!Array.isArray(rawData)) return []

    if (dataType === 'workorders') {
      return rawData.map(item => ({
        id: item.WorkOrderID?.toString() || item.id || Math.random().toString(),
        primary: `WO#${item.WorkOrderID || 'N/A'}`,
        secondary: item.TechnicianName || item.CustomerName || 'N/A',
        category: item.ServiceName || 'Service Work',
        status: item.Status || 'Pending',
        amount: item.TotalAmount ? `$${item.TotalAmount.toFixed(2)}` : undefined,
      }))
    } else {
      // Users data
      return rawData.map(item => ({
        id: item.AccountID?.toString() || item.id || Math.random().toString(),
        primary: item.FullName || item.name || item.Username || 'N/A',
        secondary: item.Email || item.email || `${item.Username}@example.com`,
        category: item.Role || 'User',
        status: item.Status || 'Active',
      }))
    }
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await adminService.listAccounts()
        if (!ignore && res?.success) {
          const transformed = transformData(res.data || [])
          setRecords(transformed)
        } else if (!ignore && !res?.success) {
          setError(res?.error?.message || 'Không thể tải dữ liệu')
        }
      } catch (err: any) {
        if (!ignore) setError(err?.message || 'Không thể tải dữ liệu')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    // Only load users data from API; work orders come from dashboard grid
    if (dataType === 'users') {
      load()
    }
    return () => {
      ignore = true
    }
  }, [dataType])

  const fallbackData = useMemo<TableRow[]>(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      return transformData(data)
    }
    return []
  }, [data, dataType])

  const tableData = useMemo(() => {
    if (records.length > 0) return records
    if (loading && dataType === 'users') return []
    return fallbackData
  }, [fallbackData, loading, records, dataType])

  if (!loading && dataType === 'users' && (!tableData || tableData.length === 0)) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Danh sách người dùng gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200'
      case 'inactive':
      case 'banned':
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-slate-500/20 dark:text-slate-100'
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-200'
      case 'in progress':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-muted dark:text-foreground'
    }
  }

  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const visibleData = tableData.slice(0, pageSize)

  const isWorkOrders = dataType === 'workorders'
  const cardTitle = isWorkOrders ? 'Recent Work Orders' : 'Recent Users'
  const cardDesc = isWorkOrders ? 'Danh sách công việc gần đây' : 'Danh sách người dùng gần đây'

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDesc}</CardDescription>
        {loading && <p className="text-xs text-muted-foreground">Đang tải dữ liệu...</p>}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isWorkOrders ? 'Work Order' : 'User'}</TableHead>
                <TableHead>{isWorkOrders ? 'Technician' : 'Email'}</TableHead>
                <TableHead>{isWorkOrders ? 'Service' : 'Role'}</TableHead>
                <TableHead>Status</TableHead>
                {isWorkOrders && <TableHead className="text-right">Amount</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(row.primary)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{row.primary}</p>
                        {!isWorkOrders && <p className="text-xs text-muted-foreground">{row.secondary}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.secondary}</TableCell>
                  <TableCell className="text-sm">{row.category}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium capitalize',
                        getStatusColor(row.status)
                      )}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  {isWorkOrders && row.amount && (
                    <TableCell className="text-right font-medium text-sm">{row.amount}</TableCell>
                  )}
                </TableRow>
              ))}

              {!loading && visibleData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isWorkOrders ? 5 : 4} className="text-center text-sm text-muted-foreground py-6">
                    Không có dữ liệu để hiển thị
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={isWorkOrders ? 5 : 4} className="text-center text-sm text-muted-foreground py-6">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

