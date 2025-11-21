export interface Account {
  AccountID: number;
  Username: string;
  FullName?: string;
  Email?: string;
  Phone?: string;
  Role: 'Admin' | 'Staff' | 'Technician' | 'Customer';
  Status?: 'Active' | 'Inactive' | 'Banned';
  Address?: string;
  CreatedAt?: string;
}

export interface Model {
  ModelID: number;
  Brand: string;
  ModelName: string;
}

export interface Service {
  ServiceID: number; ServiceName: string; StandardCost: number;
  Description?: string; ImageUrl?: string; Category?: string;
}

export interface InventoryPart {
  PartID: number;
  PartName: string;
  ModelID?: number | null;
  Brand?: string | null;
  ModelName?: string | null;
  StockQuantity: number;
  MinStock: number;
  UnitPrice: number;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
}

export interface Vehicle {
  VehicleID?: number;
  AccountID?: number;
  ModelID?: number;
  VIN: string;
  LicensePlate?: string;
  Brand?: string;
  Model?: string;
  ModelName?: string;
  brand?: string | null;
  modelName?: string | null;
  Year?: number;
  Color?: string;
  Notes?: string;
  CreatedAt?: string;
  OwnerName?: string | null;
  OwnerPhone?: string | null;
  OwnerEmail?: string | null;
  mileage?: number | null;
  Mileage?: number | null;
  batterySoh?: number | null;
  batterySOH?: number | null;
}

export interface Slot {
  SlotID: number; StartTime: string; EndTime: string; Capacity: number; Status: 'Open'|'Closed';
}

export interface Appointment {
  AppointmentID: number;
  AccountID: number;
  VehicleID: number;
  SlotID: number | null;
  ScheduledDate: string;
  Status: 'Pending'|'Confirmed'|'Cancelled'|'Completed'|'Done';
  Notes?: string;
  ServiceID?: number | null;
  ServiceName?: string | null;
  serviceId?: number | null;
  serviceName?: string | null;
  ConfirmedByStaffID?: number | null;
  accountName?: string | null;
  accountPhone?: string | null;
  accountEmail?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  AccountName?: string | null;
  AccountPhone?: string | null;
  AccountEmail?: string | null;
  VIN?: string | null;
  LicensePlate?: string | null;
  SlotStart?: string | null;
  SlotEnd?: string | null;
  status?: string;
}

export interface WorkOrder {
  WorkOrderID: number;
  AppointmentID?: number;
  TechnicianID?: number | null;
  ProgressStatus?: string;
  Status?: string;
  StartTime?: string | null;
  EndTime?: string | null;
  EstimatedCompletionTime?: string | null;
  estimatedCompletionTime?: string | null;
  TotalAmount?: number;
  PartsSummary?: string | null;
  partsSummary?: string | null;
  PartsTotal?: number | null;
  partsTotal?: number | null;
  Diagnosis?: string | null;
  diagnosis?: string | null;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  technicianName?: string | null;
  customerName?: string | null;
  serviceName?: string | null;
  Progress?: number;
  // legacy uppercase aliases from API
  TechnicianName?: string | null;
  CustomerName?: string | null;
  ServiceName?: string | null;
}

export interface Invoice {
  InvoiceID: number;
  AppointmentID?: number | null;
  WorkOrderID?: number | null;
  InvoiceWorkOrderID?: number | null;
  TotalAmount: number;
  PaymentStatus: 'Unpaid' | 'Paid';
  CreatedAt?: string;
  UpdatedAt?: string;
  SentToCustomerAt?: string | null;
  SentByStaffID?: number | null;
  CustomerPaidAt?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  CustomerName?: string | null;
  CustomerPhone?: string | null;
  VIN?: string | null;
  LicensePlate?: string | null;
  WorkOrderID_Detail?: number | null;
  WorkOrderStatus?: string | null;
  WorkOrderTotalAmount?: number | null;
  WorkOrderCompletedAt?: string | null;
}

export interface PaymentTransaction {
  TransactionID: number;
  InvoiceID: number;
  Amount: number;
  Method: string;
  Status: string;
  PaymentDate?: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
  BankCode?: string | null;
  GatewayRspCode?: string | null;
  GatewayTxnNo?: string | null;
  customerName?: string | null;
  Method?: string;
  Status?: string;
  CustomerName?: string | null;
}
