// src/services/admin.service.ts
import { http } from '@/lib/api'
import type { ApiResp } from '@/types/common'
import type {
  Account,
  Service,
  Vehicle,
  Slot,
  Appointment,
  WorkOrder,
  Invoice,
  InventoryPart,
} from '@/types/entities'

export const adminService = {
  // =============== ACCOUNTS ===============
  listAccounts: (q = '') =>
    http.get<ApiResp<Account[]>>(`/account${q}`),

  createAccount: (payload: {
    username: string
    password: string
    fullName?: string
    email?: string
    phone?: string
    address?: string
    role?: Account['Role']
    status?: Account['Status']
  }) => http.post<ApiResp<Account>>('/account', payload),

  updateAccount: (
    id: number,
    payload: {
      fullName?: string
      email?: string
      phone?: string
      address?: string
      role?: Account['Role']
      status?: Account['Status']
    },
  ) => http.put<ApiResp<Account>>(`/account/${id}`, payload),

  resetAccountPassword: (id: number, payload: { password: string }) =>
    http.post<ApiResp<{}>>(`/account/${id}/reset-password`, payload),

  // =============== TECHNICIANS ===============
  // Dùng cho dropdown kỹ thuật viên
  listTechnicians: () =>
    http.get<ApiResp<Account[]>>('/technicians'),

  // alias cho code cũ dùng getTechnicians()
  getTechnicians: () =>
    http.get<ApiResp<Account[]>>('/technicians'),

  // =============== SERVICES ===============
  listServices: () =>
    http.get<ApiResp<Service[]>>('/services'),

  getService: (id: number) =>
    http.get<ApiResp<Service>>(`/services/${id}`),

  createService: (data: Partial<Service>) =>
    http.post<ApiResp<Service>>('/services', data),

  updateService: (id: number, data: Partial<Service>) =>
    http.put<ApiResp<Service>>(`/services/${id}`, data),

  deleteService: (id: number) =>
    http.del<ApiResp<{}>>(`/services/${id}`),

  // =============== VEHICLES ===============
  listVehicles: (q = '') =>
    http.get<ApiResp<Vehicle[]>>(`/vehicles${q}`),

  // một số chỗ có thể dùng VIN
  getVehicleByVIN: (vin: string) =>
    http.get<ApiResp<Vehicle>>(`/vehicles/${vin}`),

  // alias nếu có chỗ dùng getVehicle(id)
  getVehicle: (id: number) =>
    http.get<ApiResp<Vehicle>>(`/vehicles/${id}`),

  createVehicle: (data: Vehicle) =>
    http.post<ApiResp<Vehicle>>('/vehicles', data),

  updateVehicle: (id: number, data: Partial<Vehicle>) =>
    http.put<ApiResp<Vehicle>>(`/vehicles/${id}`, data),

  deleteVehicle: (id: number) =>
    http.del<ApiResp<{}>>(`/vehicles/${id}`),

  // =============== SLOTS ===============
  listSlots: (q = '') =>
    http.get<ApiResp<Slot[]>>(`/slots${q}`),

  getSlot: (id: number) =>
    http.get<ApiResp<Slot>>(`/slots/${id}`),

  createSlot: (data: Partial<Slot>) =>
    http.post<ApiResp<Slot>>('/slots', data),

  updateSlot: (id: number, data: Partial<Slot>) =>
    http.put<ApiResp<Slot>>(`/slots/${id}`, data),

  deleteSlot: (id: number) =>
    http.del<ApiResp<{}>>(`/slots/${id}`),

  // =============== APPOINTMENTS (ADMIN/STAFF) ===============
  // Code mới: anh đang có 2 style – em support luôn cả 2
  listAppointments: (q = '') =>
    http.get<ApiResp<Appointment[]>>(`/appointments${q}`),

  // trang AdminAppointments mới gọi getAppointments() -> luôn scope=admin
  getAppointments: () =>
    http.get<ApiResp<Appointment[]>>('/appointments?scope=admin'),

  // API mới: gửi body { appointmentId, technicianId }
  confirmAppointmentWithTech: (payload: {
    appointmentId: number
    technicianId: number
  }) =>
    http.post<ApiResp<{}>>(
      '/appointments/confirm-with-technician',
      payload,
    ),

  // alias cho code cũ dùng confirmAppointmentWithTechnician()
  confirmAppointmentWithTechnician: (payload: {
    appointmentId: number
    technicianId: number
  }) =>
    http.post<ApiResp<{}>>(
      '/appointments/confirm-with-technician',
      payload,
    ),

  cancelAppointment: (id: number) =>
    http.del<ApiResp<{}>>(`/appointments/${id}`),

  // =============== WORK ORDERS (ADMIN/STAFF) ===============
  listWorkOrders: (q = '') =>
    http.get<ApiResp<WorkOrder[]>>(`/workorders${q}`),

  getWorkOrder: (id: number) =>
    http.get<ApiResp<any>>(`/workorders/${id}`),

  createWorkOrder: (data: any) =>
    http.post<ApiResp<WorkOrder>>('/workorders', data),

  updateWorkOrder: (id: number, data: any) =>
    http.patch<ApiResp<WorkOrder>>(`/workorders/${id}`, data),

  // ---- Dịch vụ trong WorkOrder ----
  addWorkOrderDetail: (
    workOrderId: number,
    payload: { serviceId: number; quantity?: number; unitPrice?: number },
  ) =>
    http.post<ApiResp<any>>(
      `/workorders/${workOrderId}/details`,
      payload,
    ),

  // alias tiện nếu sau này page dùng tên khác
  addServiceToWorkOrder: (
    workOrderId: number,
    payload: { serviceId: number; quantity?: number; unitPrice?: number },
  ) =>
    http.post<ApiResp<any>>(
      `/workorders/${workOrderId}/details`,
      payload,
    ),

  deleteWorkOrderDetail: (detailId: number) =>
    http.del<ApiResp<any>>(`/workorders/details/${detailId}`),

  // alias cho code cũ dùng deleteServiceFromWorkOrder()
  deleteServiceFromWorkOrder: (detailId: number) =>
    http.del<ApiResp<any>>(`/workorders/details/${detailId}`),

  // ---- Phụ tùng trong WorkOrder ----
  addWorkOrderPart: (
    workOrderId: number,
    payload: { partId: number; quantity?: number; unitPrice?: number },
  ) =>
    http.post<ApiResp<any>>(
      `/workorders/${workOrderId}/parts`,
      payload,
    ),

  addPartToWorkOrder: (
    workOrderId: number,
    payload: { partId: number; quantity?: number; unitPrice?: number },
  ) =>
    http.post<ApiResp<any>>(
      `/workorders/${workOrderId}/parts`,
      payload,
    ),

  // =============== INVOICES ===============
  listInvoices: (q = '') =>
    http.get<ApiResp<Invoice[]>>(`/invoices${q}`),

  markInvoicePaid: (id: number) =>
    http.patch<ApiResp<{}>>(`/invoices/${id}/paid`, {}),

  markInvoiceUnpaid: (id: number) =>
    http.patch<ApiResp<{}>>(`/invoices/${id}/unpaid`, {}),

  sendInvoiceToCustomer: (id: number) =>
    http.post<ApiResp<Invoice>>(`/invoices/${id}/send`, {}),

  // =============== PAYMENTS ===============
  listPayments: (q = '') =>
    http.get<ApiResp<any[]>>(`/payments${q}`),

  // =============== INVENTORY ===============
  listInventory: () =>
    http.get<ApiResp<InventoryPart[]>>('/admin/inventory'),

  listLowStockInventory: () =>
    http.get<ApiResp<InventoryPart[]>>('/admin/inventory/low-stock'),

  createInventory: (data: {
    partName: string
    modelId: number
    stockQuantity?: number
    unitPrice: number
    minStock?: number
    warrantyMonths?: number
  }) =>
    http.post<ApiResp<InventoryPart>>('/admin/inventory', data),

  updateInventory: (partId: number, data: Partial<InventoryPart>) =>
    http.put<ApiResp<InventoryPart>>(`/admin/inventory/${partId}`, data),

  deleteInventory: (partId: number) =>
    http.del<ApiResp<{}>>(`/admin/inventory/${partId}`),

  // =============== DASHBOARD WIDGETS ===============
  getNotifications: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : ''
    return http.get<ApiResp<any[]>>(`/notifications${query}`)
  },

  markNotificationAsRead: (id: string) =>
    http.patch<ApiResp<{}>>(`/notifications/${id}/read`, {}),

  getRecentEvents: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : ''
    return http.get<ApiResp<any[]>>(`/events/recent${query}`)
  },
}

// Support cả default export
export default adminService
