// src/types/workorder.ts

export type WorkOrderStatus =
  | 'Pending'
  | 'InProgress'
  | 'OnHold'
  | 'Completed';

// Work order đang chạy của kỹ thuật viên
export interface CurrentWorkOrderDto {
  WorkOrderID: number;
  ServiceName: string | null;
  LicensePlate: string | null;

  // Status tổng quát
  Status: WorkOrderStatus;

  // Tiến độ số (0–100)
  Progress: number;

  // 👉 Các field FE technician đang dùng
  ProgressStatus?: WorkOrderStatus | string; // e.g. "InProgress"
  StartTime?: string | null;

  StartedAt?: string | null;
  CompletedAt?: string | null;

  TechnicianID?: number | null;
}

// Work order đã hoàn thành
export interface CompletedWorkOrderDto {
  WorkOrderID: number;
  ServiceName: string | null;
  LicensePlate: string | null;

  CompletedDate: string;
  TotalCost: number;

  // Thêm cho đồng bộ
  ProgressStatus?: string;
  StartTime?: string | null;
}

// 👉 Đây là type mà FE import
export type WorkOrder = CurrentWorkOrderDto | CompletedWorkOrderDto;
