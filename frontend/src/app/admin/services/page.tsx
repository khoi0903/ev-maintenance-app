 'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModal } from '@/hooks/useModal'
import { Modal } from '@/components/ui/modal'
import Label from '@/components/form/Label'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import { getUser } from '@/lib/auth'
import type { Service as ServiceType } from '@/types/entities'

export default function ServicesPage() {
  const { isOpen, openModal, closeModal } = useModal()
  const currentUser = getUser()
  const canManage = currentUser && (currentUser.Role === 'Admin' || currentUser.Role === 'Staff')

  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)

  const [formData, setFormData] = useState({
    ServiceName: '',
    StandardCost: 0,
    Description: '',
    Category: '',
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await adminService.listServices()
        if (!active) return
        if (res.success) {
          setServices(res.data || [])
        } else {
          setError(res.error?.message || 'Không thể tải danh sách dịch vụ')
          setServices([])
        }
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Lỗi khi tải dữ liệu')
        setServices([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const openAdd = () => {
    setSelectedService(null)
    setFormData({ ServiceName: '', StandardCost: 0, Description: '', Category: '' })
    openModal()
  }

  const openEdit = (s: ServiceType) => {
    setSelectedService(s)
    setFormData({
      ServiceName: s.ServiceName,
      StandardCost: Number(s.StandardCost ?? 0),
      Description: s.Description ?? '',
      Category: (s as any).Category ?? '',
    })
    openModal()
  }

  const handleDelete = async (s: ServiceType) => {
    if (!canManage) return
    if (!confirm(`Xác nhận xóa dịch vụ ${s.ServiceName}?`)) return
    try {
      const res = await adminService.deleteService(s.ServiceID)
      if (res.success) {
        setServices((prev) => prev.filter((p) => p.ServiceID !== s.ServiceID))
        alert('Đã xóa dịch vụ')
      } else {
        alert(res.error?.message || 'Lỗi khi xóa dịch vụ')
      }
    } catch (err: any) {
      console.error('Delete service error', err)
      alert(err?.message || 'Lỗi khi xóa')
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      if (!formData.ServiceName) {
        alert('Vui lòng nhập tên dịch vụ')
        return
      }

      if (!selectedService) {
        // create
        const res = await adminService.createService({
          ServiceName: formData.ServiceName,
          StandardCost: formData.StandardCost,
          Description: formData.Description,
          Category: formData.Category,
        } as any)
        if (res.success) {
          setServices((prev) => [res.data, ...prev])
          alert('Tạo dịch vụ thành công')
          closeModal()
        } else {
          alert(res.error?.message || 'Lỗi tạo dịch vụ')
        }
      } else {
        // update
        const res = await adminService.updateService(selectedService.ServiceID, {
          ServiceName: formData.ServiceName,
          StandardCost: formData.StandardCost,
          Description: formData.Description,
          Category: formData.Category,
        } as any)
        if (res.success) {
          setServices((prev) => prev.map((p) => p.ServiceID === selectedService.ServiceID ? res.data : p))
          alert('Cập nhật dịch vụ thành công')
          setSelectedService(null)
          closeModal()
        } else {
          alert(res.error?.message || 'Lỗi cập nhật dịch vụ')
        }
      }
    } catch (err: any) {
      console.error('Save service error', err)
      alert(err?.message || 'Lỗi khi lưu dịch vụ')
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase()
    if (!q) return services
    return services.filter((s) => {
      const hay = [s.ServiceName, (s as any).Category, s.Description]
        .filter(Boolean)
        .join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [services, searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-2">Quản lý danh mục dịch vụ</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Tìm kiếm dịch vụ, danh mục, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {canManage && <Button onClick={openAdd}>+ Thêm Dịch vụ</Button>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách dịch vụ</CardTitle>
          <CardDescription>{loading ? 'Đang tải...' : `Tổng: ${services.length}`}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên dịch vụ</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá chuẩn</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Đang tải...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Không có dịch vụ nào.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.ServiceID} className={cn()}>
                      <TableCell className="font-medium">{s.ServiceName}</TableCell>
                      <TableCell>{(s as any).Category || '—'}</TableCell>
                      <TableCell>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(s.StandardCost || 0))}</TableCell>
                      <TableCell className="max-w-xl truncate">{s.Description || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canManage && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(s)} title="Sửa">✏️</Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(s)} title="Xóa">🗑️</Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isOpen} onClose={() => { setSelectedService(null); closeModal() }} className="max-w-2xl m-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{selectedService ? 'Sửa Dịch vụ' : 'Thêm Dịch vụ'}</h2>
          <div className="space-y-4">
            <div>
              <Label>Tên dịch vụ *</Label>
              <Input value={formData.ServiceName} onChange={(e) => setFormData({ ...formData, ServiceName: e.target.value })} />
            </div>
            <div>
              <Label>Giá chuẩn (VND)</Label>
              <Input type="number" value={formData.StandardCost} onChange={(e) => setFormData({ ...formData, StandardCost: parseFloat(e.target.value || '0') })} />
            </div>
            <div>
              <Label>Danh mục</Label>
              <Input value={formData.Category} onChange={(e) => setFormData({ ...formData, Category: e.target.value })} />
            </div>
            <div>
              <Label>Mô tả</Label>
              <textarea className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.Description} onChange={(e) => setFormData({ ...formData, Description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setSelectedService(null); closeModal() }} disabled={isSaving}>Hủy</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Đang lưu...' : (selectedService ? 'Cập nhật' : 'Tạo mới')}</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
