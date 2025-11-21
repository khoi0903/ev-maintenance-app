import { http } from '@/lib/api';
import type { ApiResp } from '@/types/common';
import type { WorkOrder } from '@/types/workorder';

export const technicianService = {
  // Get my active work orders
  getMyActiveWorkOrders: () => http.get<ApiResp<WorkOrder[]>>('/workorders/my/active'),
  
  // Get my completed work orders
  getMyCompletedWorkOrders: () => http.get<ApiResp<WorkOrder[]>>('/workorders/my/completed'),
  
  // Get work order detail (only if assigned to me)
  getMyWorkOrder: (id: number) => http.get<ApiResp<any>>(`/workorders/my/${id}`),
  
  // Start work
  startWork: (id: number) => http.post<ApiResp<any>>(`/workorders/my/${id}/start`, {}),
  
  // Complete work
  completeWork: (id: number) => http.post<ApiResp<any>>(`/workorders/my/${id}/complete`, {}),
  
  // Update diagnosis
  updateDiagnosis: (id: number, diagnosis: string) => 
    http.patch<ApiResp<any>>(`/workorders/my/${id}/diagnosis`, { diagnosis }),
  
  // Add part usage
  addPartUsage: (id: number, data: { partId: number; quantity: number; unitPrice?: number }) =>
    http.post<ApiResp<any>>(`/workorders/my/${id}/parts`, data),
  // Delete part usage (my work order)
  deletePartUsage: (usageId: number) =>
    http.del<ApiResp<any>>(`/workorders/my/parts/${usageId}`),
};



