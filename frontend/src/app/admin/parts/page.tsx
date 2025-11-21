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
import type { InventoryPart } from '@/types/entities'

/**
 * Part Interface
 */
interface Part {
  id: string
  partNumber: string
  description: string
  supplier: string
  quantity: number
  minQuantity: number
  location: string
  cost: number
  warrantyPeriod: string
  createdAt: string
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
})

const mapInventoryToPart = (item: InventoryPart): Part => ({
  id: `PART-${item.PartID}`,
  partNumber: item.PartName || `PART-${item.PartID}`,
  description: item.Brand || '—',
  supplier: item.Brand || '—',
  quantity: Number(item.StockQuantity ?? 0),
  minQuantity: Number(item.MinStock ?? 0),
  location: '—',
  cost: Number(item.UnitPrice ?? 0),
  warrantyPeriod: '—',
  createdAt: item.UpdatedAt || item.CreatedAt || '',
})

const formatCurrency = (value: number) => currencyFormatter.format(Number(value ?? 0))

/**
 * Parts & Inventory Page - Trang quản lý kho và phụ tùng
 */
export default function PartsPage() {
  const { isOpen, openModal, closeModal } = useModal()
  const currentUser = getUser()
  const canManage = currentUser && (currentUser.Role === 'Admin' || currentUser.Role === 'Staff')
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [actionType, setActionType] = useState<'add' | 'receive' | 'issue' | 'transfer'>('add')
  const [searchTerm, setSearchTerm] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const [parts, setParts] = useState<Part[]>([])
  const [lowStockAlert, setLowStockAlert] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state cho add
  const [formData, setFormData] = useState({
    partName: '',
    modelId: 1,
    stockQuantity: 0,
    unitPrice: 0,
    minStock: 5,
    warrantyMonths: null as number | null,
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [allRes, lowRes] = await Promise.all([
          adminService.listInventory(),
          adminService.listLowStockInventory(),
        ])

        if (!active) return

        if (allRes.success) {
          setParts((allRes.data || []).map(mapInventoryToPart))
        } else {
          setError(allRes.error?.message || 'Không thể tải danh sách phụ tùng')
          setParts([])
        }

        if (lowRes.success) {
          setLowStockAlert((lowRes.data || []).map(mapInventoryToPart))
        } else {
          setLowStockAlert([])
        }
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Không thể tải dữ liệu kho')
        setParts([])
        setLowStockAlert([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const handleAddNew = () => {
    setSelectedPart(null)
    setActionType('add')
    openModal()
  }

  const handleReceiveStock = (part: Part) => {
    setSelectedPart(part)
    setActionType('receive')
    openModal()
  }

  const handleEditPart = (part: Part) => {
    setSelectedPart(part)
    setActionType('add') // reuse add form for edit
    // prefill formData
    setFormData({
      partName: part.partNumber,
      modelId: 1,
      stockQuantity: part.quantity,
      unitPrice: part.cost,
      minStock: part.minQuantity,
      warrantyMonths: null,
    })
    openModal()
  }

  const handleDeletePart = async (part: Part) => {
    if (!confirm(`Xác nhận xóa phụ tùng ${part.partNumber}?`)) return
    try {
      const partIdMatch = part.id.match(/PART-(\d+)/)
      const partId = partIdMatch ? parseInt(partIdMatch[1], 10) : null
      if (!partId) throw new Error('Không xác định được PartID')
      const res = await adminService.deleteInventory(partId)
      if (res.success) {
        // reload lists
        const [allRes, lowRes] = await Promise.all([
          adminService.listInventory(),
          adminService.listLowStockInventory(),
        ])
        if (allRes.success) setParts((allRes.data || []).map(mapInventoryToPart))
        if (lowRes.success) setLowStockAlert((lowRes.data || []).map(mapInventoryToPart))
        alert('Đã xóa phụ tùng')
      } else {
        alert(res.error?.message || 'Lỗi khi xóa phụ tùng')
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      alert(err?.message || 'Lỗi khi xóa')
    }
  }

  const handleIssueStock = (part: Part) => {
    setSelectedPart(part)
    setActionType('issue')
    openModal()
  }

  const handleTransferStock = (part: Part) => {
    setSelectedPart(part)
    setActionType('transfer')
    openModal()
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      if (actionType === 'add' && !selectedPart) {
        if (!formData.partName || !formData.unitPrice) {
          alert('Vui lòng điền các trường bắt buộc')
          return
        }

        const res = await adminService.createInventory({
          partName: formData.partName,
          modelId: formData.modelId,
          stockQuantity: formData.stockQuantity,
          unitPrice: formData.unitPrice,
          minStock: formData.minStock,
          warrantyMonths: formData.warrantyMonths ?? undefined,
        })

        if (res.success) {
          // Reload data
          const [allRes, lowRes] = await Promise.all([
            adminService.listInventory(),
            adminService.listLowStockInventory(),
          ])

          if (allRes.success) {
            setParts((allRes.data || []).map(mapInventoryToPart))
          }
          if (lowRes.success) {
            setLowStockAlert((lowRes.data || []).map(mapInventoryToPart))
          }

          alert('Tạo phụ tùng thành công')
          closeModal()
          setFormData({
            partName: '',
            modelId: 1,
            stockQuantity: 0,
            unitPrice: 0,
            minStock: 5,
            warrantyMonths: null,
          })
        } else {
          alert(res.error?.message || 'Lỗi tạo phụ tùng')
        }
      } else if (actionType === 'add' && selectedPart) {
        // Edit existing part
        if (!formData.partName || !formData.unitPrice) {
          alert('Vui lòng điền các trường bắt buộc')
          return
        }

        const partIdMatch = selectedPart.id.match(/PART-(\d+)/)
        const partId = partIdMatch ? parseInt(partIdMatch[1], 10) : null
        if (!partId) {
          alert('Không xác định được PartID')
          return
        }

        const res = await adminService.updateInventory(partId, {
          PartName: formData.partName,
          ModelID: formData.modelId,
          StockQuantity: formData.stockQuantity,
          UnitPrice: formData.unitPrice,
          MinStock: formData.minStock,
          WarrantyMonths: formData.warrantyMonths ?? null,
        } as any)

        if (res.success) {
          const [allRes, lowRes] = await Promise.all([
            adminService.listInventory(),
            adminService.listLowStockInventory(),
          ])
          if (allRes.success) setParts((allRes.data || []).map(mapInventoryToPart))
          if (lowRes.success) setLowStockAlert((lowRes.data || []).map(mapInventoryToPart))
          alert('Cập nhật phụ tùng thành công')
          closeModal()
          setSelectedPart(null)
        } else {
          alert(res.error?.message || 'Lỗi cập nhật phụ tùng')
        }
      } else {
        // Handle receive, issue, transfer logic here
        alert(`${actionType} - Chức năng sắp có`)
      }
    } catch (err: any) {
      console.error('Save error:', err)
      alert(err?.message || 'Lỗi khi lưu')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredParts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    const base = lowStockOnly
      ? parts.filter((part) => part.quantity < part.minQuantity)
      : parts

    if (!keyword) return base

    return base.filter((part) => {
      const haystack = [part.partNumber, part.description, part.supplier]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(keyword)
    })
  }, [parts, lowStockOnly, searchTerm])

  const combinedLowStock = useMemo(() => {
    if (lowStockAlert.length) return lowStockAlert
    return parts.filter((p) => p.quantity < p.minQuantity)
  }, [lowStockAlert, parts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts & Inventory</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý kho và phụ tùng
          </p>
        </div>
        {canManage && <Button onClick={handleAddNew}>+ Thêm Phụ tùng</Button>}
      </div>

      {/* Low Stock Alert */}
      {combinedLowStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">⚠️ Cảnh báo Tồn kho Thấp</CardTitle>
            <CardDescription className="text-orange-700">
              {combinedLowStock.length} phụ tùng đang dưới mức tối thiểu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {combinedLowStock.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-2 bg-white rounded"
                >
                  <div>
                    <span className="font-medium">{part.partNumber}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {part.description}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-red-600 font-medium">
                      {part.quantity}
                    </span>
                    <span className="text-muted-foreground">
                      {' / '}
                      {part.minQuantity} (tối thiểu)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Tìm kiếm theo mã, mô tả, hoặc nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lowStockOnly"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="lowStockOnly" className="text-sm">
                Chỉ hiển thị tồn kho thấp
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Phụ tùng</CardTitle>
          <CardDescription>
            {loading ? 'Đang tải dữ liệu...' : `Tổng số: ${parts.length} phụ tùng`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Nhà Cung cấp</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Tối thiểu</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Giá Gốc</TableHead>
                  <TableHead>Bảo hành</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                      Không có phụ tùng nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow
                      key={part.id}
                      className={cn(
                        part.quantity < part.minQuantity && 'bg-red-50'
                      )}
                    >
                      <TableCell className="font-medium font-mono">
                        {part.partNumber}
                      </TableCell>
                      <TableCell>{part.description}</TableCell>
                      <TableCell>{part.supplier}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'font-medium',
                            part.quantity < part.minQuantity && 'text-red-600'
                          )}
                        >
                          {part.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{part.minQuantity}</TableCell>
                      <TableCell>{part.location}</TableCell>
                      <TableCell>{formatCurrency(part.cost)}</TableCell>
                      <TableCell>{part.warrantyPeriod}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReceiveStock(part)}
                            title="Nhập kho"
                          >
                            ➕
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIssueStock(part)}
                            title="Xuất kho"
                          >
                            ➖
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTransferStock(part)}
                            title="Chuyển kho"
                          >
                            ↔️
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPart(part)}
                                title="Sửa phụ tùng"
                              >
                                ✏️
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePart(part)}
                                title="Xóa phụ tùng"
                              >
                                🗑️
                              </Button>
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

      {/* Add/Edit/Receive/Issue/Transfer Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-4xl m-4">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <h2 className="text-2xl font-bold mb-4">
            {actionType === 'add' && !selectedPart && 'Thêm Phụ tùng mới'}
            {actionType === 'add' && selectedPart && 'Sửa Phụ tùng'}
            {actionType === 'receive' && 'Nhập kho'}
            {actionType === 'issue' && 'Xuất kho'}
            {actionType === 'transfer' && 'Chuyển kho'}
          </h2>

          <div className="space-y-6 mt-6">
            {actionType === 'add' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Part Number *</Label>
                  <Input
                    value={formData.partName}
                    onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                    placeholder="BAT-60KWH-001"
                  />
                </div>
                <div>
                  <Label>Model ID *</Label>
                  <Input
                    type="number"
                    value={formData.modelId}
                    onChange={(e) => setFormData({ ...formData, modelId: parseInt(e.target.value) })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Số lượng Ban đầu</Label>
                  <Input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Tồn kho Tối thiểu *</Label>
                  <Input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 5 })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label>Giá Gốc (VND) *</Label>
                  <Input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="50000000"
                  />
                </div>
                <div>
                  <Label>Hạn Bảo hành (Tháng)</Label>
                  <Input
                    type="number"
                    value={formData.warrantyMonths || ''}
                    onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="96"
                  />
                </div>
              </div>
            )}

            {actionType === 'receive' && selectedPart && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Phụ tùng</p>
                  <p className="font-medium">{selectedPart.partNumber} - {selectedPart.description}</p>
                  <p className="text-sm">Tồn kho hiện tại: <span className="font-medium">{selectedPart.quantity}</span></p>
                </div>
                <div>
                  <Label>Số lượng Nhập *</Label>
                  <Input type="number" placeholder="10" />
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Ghi chú về lô hàng nhập..."
                  />
                </div>
              </div>
            )}

            {actionType === 'issue' && selectedPart && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Phụ tùng</p>
                  <p className="font-medium">{selectedPart.partNumber} - {selectedPart.description}</p>
                  <p className="text-sm">Tồn kho hiện tại: <span className="font-medium">{selectedPart.quantity}</span></p>
                </div>
                <div>
                  <Label>Số lượng Xuất *</Label>
                  <Input type="number" placeholder="1" />
                </div>
                <div>
                  <Label>Work Order ID *</Label>
                  <Input placeholder="WO-2024-001" />
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Ghi chú về việc xuất kho..."
                  />
                </div>
              </div>
            )}

            {actionType === 'transfer' && selectedPart && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Phụ tùng</p>
                  <p className="font-medium">{selectedPart.partNumber} - {selectedPart.description}</p>
                  <p className="text-sm">Vị trí hiện tại: <span className="font-medium">{selectedPart.location}</span></p>
                </div>
                <div>
                  <Label>Số lượng Chuyển *</Label>
                  <Input type="number" placeholder="5" />
                </div>
                <div>
                  <Label>Vị trí Đích *</Label>
                  <Input placeholder="Kệ B-5" />
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Ghi chú về việc chuyển kho..."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={closeModal} disabled={isSaving}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Đang xử lý...' : (
                  <>
                    {actionType === 'add' && 'Tạo mới'}
                    {actionType === 'receive' && 'Nhập kho'}
                    {actionType === 'issue' && 'Xuất kho'}
                    {actionType === 'transfer' && 'Chuyển kho'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}


