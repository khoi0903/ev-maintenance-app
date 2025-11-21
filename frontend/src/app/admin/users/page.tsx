'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminService } from '@/services/admin.service'
import type { Account } from '@/types/entities'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'

type ManagedAccount = Account & {
  Address?: string
  CreatedAt?: string
}

type RoleFilter = 'ALL' | Account['Role']
type StatusFilter = 'ALL' | NonNullable<Account['Status']>

const ROLE_BADGES: Record<RoleFilter, string> = {
  ALL: 'bg-muted text-muted-foreground',
  Admin: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
  Staff: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100',
  Technician: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  Customer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
}

const STATUS_BADGES: Record<StatusFilter, string> = {
  ALL: 'bg-muted text-muted-foreground',
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  Inactive: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  Banned: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
}

const DEFAULT_FORM = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  role: 'Customer' as Account['Role'],
  status: 'Active' as NonNullable<Account['Status']>,
}

export default function AdminUsersPage() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)

  const [selectedAccount, setSelectedAccount] = useState<ManagedAccount | null>(null)
  const [formState, setFormState] = useState({ ...DEFAULT_FORM })

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.listAccounts()
      if (res.success) {
        setAccounts(res.data as ManagedAccount[])
      } else {
        throw new Error(res.error?.message || 'Không thể tải danh sách tài khoản')
      }
    } catch (err: any) {
      console.error('Fetch accounts failed:', err)
      setError(err?.message || 'Không thể tải danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const filteredAccounts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return accounts.filter((acc) => {
      const matchesKeyword =
        !keyword ||
        acc.FullName?.toLowerCase().includes(keyword) ||
        acc.Username.toLowerCase().includes(keyword) ||
        acc.Email?.toLowerCase().includes(keyword) ||
        acc.Phone?.toLowerCase().includes(keyword)

      const matchesRole = roleFilter === 'ALL' || acc.Role === roleFilter
      const matchesStatus = statusFilter === 'ALL' || acc.Status === statusFilter

      return matchesKeyword && matchesRole && matchesStatus
    })
  }, [accounts, roleFilter, search, statusFilter])

  const openCreateModal = () => {
    setSelectedAccount(null)
    setFormState({ ...DEFAULT_FORM })
    setModalError(null)
    setEditModalOpen(true)
  }

  const openEditModal = (account: ManagedAccount) => {
    setSelectedAccount(account)
    setFormState({
      username: account.Username,
      password: '',
      fullName: account.FullName ?? '',
      email: account.Email ?? '',
      phone: account.Phone ?? '',
      address: account.Address ?? '',
      role: account.Role,
      status: account.Status ?? 'Active',
    })
    setModalError(null)
    setEditModalOpen(true)
  }

  const openResetModal = (account: ManagedAccount) => {
    setSelectedAccount(account)
    setResetPassword('')
    setResetError(null)
    setResetModalOpen(true)
  }

  const closeModals = () => {
    setEditModalOpen(false)
    setResetModalOpen(false)
    setFormSubmitting(false)
    setResetSubmitting(false)
    setModalError(null)
    setResetError(null)
  }

  const handleChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmitAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (formSubmitting) return

    setFormSubmitting(true)
    setModalError(null)
    try {
      if (selectedAccount) {
        const payload = {
          fullName: formState.fullName,
          email: formState.email,
          phone: formState.phone,
          address: formState.address,
          role: formState.role,
          status: formState.status,
        }
        const res = await adminService.updateAccount(selectedAccount.AccountID, payload)
        if (!res.success) throw new Error(res.error?.message || 'Cập nhật tài khoản thất bại')
      } else {
        if (!formState.username.trim()) throw new Error('Vui lòng nhập tên tài khoản')
        if (!formState.password.trim()) throw new Error('Vui lòng nhập mật khẩu mặc định')
        const res = await adminService.createAccount({
          username: formState.username.trim(),
          password: formState.password,
          fullName: formState.fullName,
          email: formState.email,
          phone: formState.phone,
          address: formState.address,
          role: formState.role,
          status: formState.status,
        })
        if (!res.success) throw new Error(res.error?.message || 'Tạo tài khoản thất bại')
      }
      await fetchAccounts()
      closeModals()
    } catch (err: any) {
      console.error('Submit account failed:', err)
      setModalError(err?.message || 'Không thể lưu tài khoản')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedAccount || resetSubmitting) return
    if (!resetPassword.trim()) {
      setResetError('Vui lòng nhập mật khẩu mới')
      return
    }
    setResetSubmitting(true)
    setResetError(null)
    try {
      const res = await adminService.resetAccountPassword(selectedAccount.AccountID, {
        password: resetPassword,
      })
      if (!res.success) throw new Error(res.error?.message || 'Đặt lại mật khẩu thất bại')
      closeModals()
    } catch (err: any) {
      console.error('Reset password failed:', err)
      setResetError(err?.message || 'Không thể đặt lại mật khẩu')
    } finally {
      setResetSubmitting(false)
    }
  }

  const formatDate = (value?: string) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString('vi-VN', { hour12: false })
    } catch {
      return value
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Quản lý Người dùng &amp; Phân quyền</h1>
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu người dùng...</p>
        </header>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">Vui lòng đợi trong giây lát.</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Quản lý Người dùng &amp; Phân quyền</h1>
          <p className="text-sm text-muted-foreground">Không thể tải dữ liệu.</p>
        </header>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-destructive">Có lỗi xảy ra</h2>
          <p className="mt-2 text-sm text-destructive/80">{error}</p>
          <Button className="mt-4" onClick={fetchAccounts}>
            Thử tải lại
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Quản lý Người dùng &amp; Phân quyền</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi tài khoản, phân quyền truy cập và thực hiện các thao tác quản trị nhanh chóng.
            </p>
          </div>
          <Button className="px-5 py-2 text-sm font-semibold" onClick={openCreateModal}>
            Thêm Tài khoản Mới
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            className="md:col-span-1"
            placeholder="Tìm kiếm theo tên, username, email, số điện thoại..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vai trò</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            >
              <option value="ALL">Tất cả</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Technician">Technician</option>
              <option value="Customer">Customer</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trạng thái</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="ALL">Tất cả</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table className="min-w-[1100px]">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Người dùng
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Username
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Vai trò
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Số điện thoại
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Trạng thái
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filteredAccounts.map((acc) => (
                  <TableRow key={acc.AccountID}>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://ui-avatars.com/api/?background=0D9488&color=fff&name=${encodeURIComponent(
                              acc.FullName || acc.Username
                            )}`}
                            alt={acc.FullName || acc.Username}
                          />
                          <AvatarFallback className="text-sm font-semibold">
                            {(acc.FullName || acc.Username)
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="block text-sm font-semibold text-foreground">
                            {acc.FullName || acc.Username}
                          </span>
                          <span className="block text-xs text-muted-foreground">ID: {acc.AccountID}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-foreground">{acc.Username}</TableCell>
                    <TableCell className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          ROLE_BADGES[acc.Role]
                        )}
                      >
                        {acc.Role}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">{acc.Email || '—'}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">{acc.Phone || '—'}</TableCell>
                    <TableCell className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          STATUS_BADGES[(acc.Status ?? 'Active') as StatusFilter]
                        )}
                      >
                        {acc.Status ?? 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDate(acc.CreatedAt)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEditModal(acc)}>
                          Chỉnh sửa
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openResetModal(acc)}>
                          Đặt lại mật khẩu
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!filteredAccounts.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Không có tài khoản nào phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
      </div>

      <Modal isOpen={editModalOpen} onClose={closeModals} className="w-full max-w-3xl">
        <form onSubmit={handleSubmitAccount} className="space-y-6 p-6 md:p-8">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {selectedAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedAccount
                ? 'Cập nhật thông tin, phân quyền và trạng thái hoạt động của tài khoản.'
                : 'Nhập thông tin cơ bản để tạo tài khoản mới và cấp quyền phù hợp.'}
            </p>
          </header>

          {modalError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {modalError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {!selectedAccount && (
              <>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-medium text-foreground">Tên tài khoản (Username)</label>
                  <Input
                    placeholder="Ví dụ: admin2"
                    value={formState.username}
                    onChange={(event) => handleChange('username', event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-medium text-foreground">Mật khẩu mặc định</label>
                  <Input
                    type="password"
                    placeholder="Nhập mật khẩu tạm"
                    value={formState.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Họ và tên</label>
              <Input
                placeholder="Nguyễn Văn A"
                value={formState.fullName}
                onChange={(event) => handleChange('fullName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Số điện thoại</label>
              <Input
                placeholder="0909 123 456"
                value={formState.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="example@ev.vn"
                value={formState.email}
                onChange={(event) => handleChange('email', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Địa chỉ</label>
              <Input
                placeholder="Địa chỉ liên hệ"
                value={formState.address}
                onChange={(event) => handleChange('address', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Vai trò</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formState.role}
                onChange={(event) => handleChange('role', event.target.value)}
              >
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Technician">Technician</option>
                <option value="Customer">Customer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trạng thái</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formState.status}
                onChange={(event) => handleChange('status', event.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Banned">Banned</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModals} disabled={formSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Đang lưu...' : selectedAccount ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={resetModalOpen} onClose={closeModals} className="w-full max-w-md">
        <div className="space-y-5 p-6 md:p-8">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Đặt lại mật khẩu</h2>
            <p className="text-sm text-muted-foreground">
              Nhập mật khẩu mới cho tài khoản{' '}
              <span className="font-semibold text-foreground">
                {selectedAccount?.FullName || selectedAccount?.Username}
              </span>
              . Người dùng sẽ được yêu cầu đăng nhập lại với mật khẩu này.
            </p>
          </header>

          {resetError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {resetError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mật khẩu mới</label>
            <Input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={closeModals} disabled={resetSubmitting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleResetPassword} disabled={resetSubmitting}>
              {resetSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lại'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

