'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModal } from '@/hooks/useModal'
import { Modal } from '@/components/ui/modal'
import Label from '@/components/form/Label'
import { cn } from '@/lib/utils'

/**
 * Warranty Claim Status Enum
 */
type ClaimStatus = 'Submitted' | 'Policy Check' | 'Technical Review' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Closed'

/**
 * Approval Decision Enum
 */
type ApprovalDecision = 'Approved' | 'Rejected' | 'Pending'

/**
 * Warranty Claim Interface
 */
interface WarrantyClaim {
  id: string
  workOrderId: string
  vehicleVIN: string
  failureDate: string
  failureKm: number
  dtcCode: string
  policyCode: string
  decision: ApprovalDecision
  rejectionReason?: string
  claimCost: number
  refundStatus: 'Chưa yêu cầu' | 'Đã yêu cầu NCC' | 'Đã hoàn trả'
  status: ClaimStatus
  createdAt: string
}

/**
 * Warranty Claims Page - Trang quản lý yêu cầu bảo hành
 */
export default function WarrantyClaimsPage() {
  const { isOpen, openModal, closeModal } = useModal()
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'All'>('All')
  const [decisionFilter, setDecisionFilter] = useState<ApprovalDecision | 'All'>('All')
  const [dtcFilter, setDtcFilter] = useState<string>('All')

  // Sample data
  const [claims, setClaims] = useState<WarrantyClaim[]>([
    {
      id: 'WC-2024-001',
      workOrderId: 'WO-2024-002',
      vehicleVIN: 'VIN987654321',
      failureDate: '2024-01-10',
      failureKm: 45000,
      dtcCode: 'P0AA6',
      policyCode: 'Pin 8 năm / 160.000km',
      decision: 'Approved',
      claimCost: 15000000,
      refundStatus: 'Đã yêu cầu NCC',
      status: 'Approved',
      createdAt: '2024-01-11',
    },
    {
      id: 'WC-2024-002',
      workOrderId: 'WO-2024-003',
      vehicleVIN: 'VIN555666777',
      failureDate: '2024-01-12',
      failureKm: 120000,
      dtcCode: 'P0A1F',
      policyCode: 'Pin 8 năm / 160.000km',
      decision: 'Pending',
      claimCost: 0,
      refundStatus: 'Chưa yêu cầu',
      status: 'Technical Review',
      createdAt: '2024-01-13',
    },
    {
      id: 'WC-2024-003',
      workOrderId: 'WO-2024-004',
      vehicleVIN: 'VIN111222333',
      failureDate: '2024-01-08',
      failureKm: 170000,
      dtcCode: 'P0AA6',
      policyCode: 'Pin 8 năm / 160.000km',
      decision: 'Rejected',
      rejectionReason: 'Vượt quá km bảo hành (160,000km)',
      claimCost: 0,
      refundStatus: 'Chưa yêu cầu',
      status: 'Rejected',
      createdAt: '2024-01-09',
    },
  ])

  const statusColors: Record<ClaimStatus, string> = {
    'Submitted': 'bg-blue-100 text-blue-800',
    'Policy Check': 'bg-yellow-100 text-yellow-800',
    'Technical Review': 'bg-purple-100 text-purple-800',
    'Awaiting Approval': 'bg-orange-100 text-orange-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Closed': 'bg-gray-100 text-gray-800',
  }

  const decisionColors: Record<ApprovalDecision, string> = {
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
  }

  const handleViewDetails = (claim: WarrantyClaim) => {
    setSelectedClaim(claim)
    openModal()
  }

  const handleApprove = (claimId: string) => {
    setClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId
          ? { ...claim, decision: 'Approved', status: 'Approved' }
          : claim
      )
    )
  }

  const handleReject = (claimId: string, reason: string) => {
    setClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId
          ? { ...claim, decision: 'Rejected', status: 'Rejected', rejectionReason: reason }
          : claim
      )
    )
  }

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.vehicleVIN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.dtcCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || claim.status === statusFilter
    const matchesDecision = decisionFilter === 'All' || claim.decision === decisionFilter
    const matchesDtc = dtcFilter === 'All' || claim.dtcCode === dtcFilter
    return matchesSearch && matchesStatus && matchesDecision && matchesDtc
  })

  const uniqueDtcCodes = Array.from(new Set(claims.map((c) => c.dtcCode)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warranty Claims</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý yêu cầu bảo hành
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Tìm kiếm theo ID, VIN, DTC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ClaimStatus | 'All')}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="Submitted">Tiếp nhận</option>
                <option value="Policy Check">Xác minh Chính sách</option>
                <option value="Technical Review">Đang Chẩn đoán</option>
                <option value="Awaiting Approval">Chờ Phê duyệt</option>
                <option value="Approved">Phê duyệt</option>
                <option value="Rejected">Từ chối</option>
                <option value="Closed">Đã Hoàn tất</option>
              </select>
            </div>
            <div>
              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value as ApprovalDecision | 'All')}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="All">Tất cả quyết định</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <select
                value={dtcFilter}
                onChange={(e) => setDtcFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="All">Tất cả mã lỗi</option>
                {uniqueDtcCodes.map((dtc) => (
                  <option key={dtc} value={dtc}>
                    {dtc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warranty Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Warranty Claims</CardTitle>
          <CardDescription>
            Tổng số: {filteredClaims.length} claims | Pending: {claims.filter((c) => c.decision === 'Pending').length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Ngày Lỗi</TableHead>
                  <TableHead>Km khi Lỗi</TableHead>
                  <TableHead>Mã DTC</TableHead>
                  <TableHead>Quyết định</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Chi phí</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.id}</TableCell>
                    <TableCell>{claim.workOrderId}</TableCell>
                    <TableCell>{claim.vehicleVIN}</TableCell>
                    <TableCell>{claim.failureDate}</TableCell>
                    <TableCell>{claim.failureKm.toLocaleString()} km</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{claim.dtcCode}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          decisionColors[claim.decision]
                        )}
                      >
                        {claim.decision}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          statusColors[claim.status]
                        )}
                      >
                        {claim.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {claim.claimCost > 0
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(claim.claimCost)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(claim)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-4xl m-4">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <h2 className="text-2xl font-bold mb-4">Chi tiết Warranty Claim</h2>

          {selectedClaim && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Claim ID</Label>
                  <p className="text-sm font-medium">{selectedClaim.id}</p>
                </div>
                <div>
                  <Label>Work Order ID</Label>
                  <p className="text-sm font-medium">{selectedClaim.workOrderId}</p>
                </div>
                <div>
                  <Label>Vehicle VIN</Label>
                  <p className="text-sm font-medium">{selectedClaim.vehicleVIN}</p>
                </div>
                <div>
                  <Label>Ngày Phát sinh Lỗi</Label>
                  <p className="text-sm font-medium">{selectedClaim.failureDate}</p>
                </div>
                <div>
                  <Label>Km khi Lỗi</Label>
                  <p className="text-sm font-medium">{selectedClaim.failureKm.toLocaleString()} km</p>
                </div>
                <div>
                  <Label>Mã Lỗi DTC</Label>
                  <p className="text-sm font-mono font-medium">{selectedClaim.dtcCode}</p>
                </div>
                <div>
                  <Label>Mã Chính sách</Label>
                  <p className="text-sm font-medium">{selectedClaim.policyCode}</p>
                </div>
                <div>
                  <Label>Quyết định Phê duyệt</Label>
                  <span
                    className={cn(
                      'inline-block px-2 py-1 rounded-full text-xs font-medium',
                      decisionColors[selectedClaim.decision]
                    )}
                  >
                    {selectedClaim.decision}
                  </span>
                </div>
                <div>
                  <Label>Chi phí Claim</Label>
                  <p className="text-sm font-medium">
                    {selectedClaim.claimCost > 0
                      ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(selectedClaim.claimCost)
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label>Trạng thái Hoàn trả</Label>
                  <p className="text-sm font-medium">{selectedClaim.refundStatus}</p>
                </div>
              </div>

              {selectedClaim.rejectionReason && (
                <div>
                  <Label>Lý do Từ chối</Label>
                  <p className="text-sm text-red-600">{selectedClaim.rejectionReason}</p>
                </div>
              )}

              {selectedClaim.decision === 'Pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const reason = prompt('Nhập lý do từ chối (nếu có):')
                      if (reason !== null) {
                        handleReject(selectedClaim.id, reason || 'Không đủ điều kiện')
                        closeModal()
                      }
                    }}
                    variant="destructive"
                  >
                    Từ chối
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove(selectedClaim.id)
                      closeModal()
                    }}
                  >
                    Phê duyệt
                  </Button>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={closeModal}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}


