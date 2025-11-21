// src/services/user.service.ts
import { http } from '@/lib/api';
import type { ApiResp } from '@/types/common';
import type { Service, Vehicle, Appointment, Invoice, Model } from '@/types/entities';
import type { CurrentWorkOrderDto, CompletedWorkOrderDto } from '@/types/workorder';

// nếu chưa có type này thì tạm dùng any
export type WorkOrderDetailDto = {
  WorkOrderID: number
  AppointmentID: number | null
  LicensePlate?: string | null
  VIN?: string | null
  ServiceName?: string | null
  ProgressStatus?: string
  StartedAt?: string | null
  CompletedAt?: string | null
  TotalAmount?: number | null
  InvoiceID?: number | null
  InvoiceTotal?: number | null
  InvoicePaymentStatus?: 'Paid' | 'Unpaid' | 'Partial' | string | null
  ServiceDetails?: Array<{
    ServiceName: string
    Quantity: number
    UnitPrice: number
    SubTotal: number
  }>
  // chi tiết phụ tùng
  PartUsages?: Array<{
    PartName: string
    Quantity: number
    UnitPrice: number
    SubTotal: number
  }>
} & Record<string, any>


export const userService = {
  // Services
  listServices: () => http.get<ApiResp<Service[]>>('/services'),
  getServiceById: (id: number) => http.get<ApiResp<Service>>(`/services/${id}`),

  // Models
  listModels: () => http.get<ApiResp<Model[]>>('/models'),

  // My Vehicles
  myVehicles: () => http.get<ApiResp<Vehicle[]>>('/vehicles'),
  addMyVehicle: (payload: Partial<Vehicle>) =>
    http.post<ApiResp<Vehicle>>('/vehicles', payload),
  updateMyVehicle: (id: number, payload: Partial<Vehicle>) =>
    http.put<ApiResp<Vehicle>>(`/vehicles/${id}`, payload),
  deleteMyVehicle: (id: number) =>
    http.del<ApiResp<{}>>(`/vehicles/${id}`),

  // Appointments
  
  myAppointments: () => http.get<ApiResp<Appointment[]>>('/appointments/my'),
  createAppointment: (payload: {
    serviceId: number;
    scheduledDate: string;
    slotId?: number;
    vehicleVin: string;
    notes?: string;
  }) => http.post<ApiResp<Appointment>>('/appointments', payload),

  // Invoices
  myInvoices: () => http.get<ApiResp<Invoice[]>>('/invoices/my'),
  getInvoiceById: (id: number) =>
    http.get<ApiResp<Invoice>>(`/invoices/${id}`),

  // Lấy invoice + pending transaction theo appointment
  getPaymentInfoByAppointment: ({
    appointmentId,
    serviceId,
  }: {
    appointmentId: number;
    serviceId?: number;
  }) => {
    let url = `/payments/by-appointment?appointmentId=${appointmentId}`;
    if (serviceId) url += `&serviceId=${serviceId}`;
    return http.get<
      ApiResp<{
        invoice: Invoice | null;
        pending: null | {
          transactionId: number;
          status: string;
          amount: number;
          method: string;
          checkoutUrl?: string | null;
          updatedAt?: string;
        };
      }>
    >(url);
  },

  // Tạo / tái sử dụng checkout
  createPayment: (payload: {
    invoiceId: number;
    amount?: number;
    method: 'Banking' | 'VNPAY';
    bankCode?: string;
    returnUrl?: string;
  }) =>
    http.post<
      ApiResp<{
        checkoutUrl?: string;
        invoiceId?: number;
        paymentTxnId?: number;
      }>
    >('/payments/create-checkout', payload),

  getPaymentStatus: (txnId: number) =>
    http.get<
      ApiResp<{
        transactionId: number;
        status: string;
        invoiceId: number;
        amount: number;
        method: string;
        updatedAt?: string;
      }>
    >(`/payments/${txnId}/status`),

  // Customer xác nhận đã trả tiền
  confirmInvoicePaid: (invoiceId: number) =>
    http.post<ApiResp<Invoice>>(`/invoices/${invoiceId}/customer-paid`, {}),

  // WorkOrders
  getMyActiveWorkOrders: () =>
    http.get<ApiResp<CurrentWorkOrderDto[]>>('/workorders/my/active'),

  getMyCompletedWorkOrders: () =>
    http.get<ApiResp<CompletedWorkOrderDto[]>>('/workorders/my/completed'),

  // chi tiết workorder cho customer, dùng WorkOrderID
  getMyWorkOrderDetail: (workOrderId: number) =>
    http.get<ApiResp<any>>(`/workorders/my/${workOrderId}`),

  getWorkOrderByAppointment: (appointmentId: number) =>
    http.get<ApiResp<any>>(`/workorders/appointment/${appointmentId}`),
};
