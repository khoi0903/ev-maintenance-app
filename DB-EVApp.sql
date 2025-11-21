-- =============================================
-- EVServiceCenterDB 
-- =============================================



CREATE DATABASE EVServiceCenterDB;
GO
USE EVServiceCenterDB;
GO

/* =======================
   Core tables
   =======================*/

-- Account
CREATE TABLE dbo.Account (
    AccountID     INT IDENTITY(1,1) PRIMARY KEY,
    Username      NVARCHAR(50)  NOT NULL UNIQUE,
    PasswordHash  NVARCHAR(255) NOT NULL,
    Role          NVARCHAR(20)  NOT NULL CHECK (Role IN ('Customer','Staff','Technician','Admin')),
    FullName      NVARCHAR(100) NOT NULL,
    Phone         NVARCHAR(20)  NULL,
    Email         NVARCHAR(100) NULL,
    Address       NVARCHAR(200) NULL,
    Status        NVARCHAR(20)  NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active','Inactive','Banned')),
    CreatedAt     DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt     DATETIME2      NULL
);

-- Model
CREATE TABLE dbo.Model (
    ModelID     INT IDENTITY(1,1) PRIMARY KEY,
    Brand       NVARCHAR(100) NOT NULL,
    ModelName   NVARCHAR(100) NOT NULL,
    EngineSpec  NVARCHAR(200) NULL,
    CreatedAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2     NULL
);

-- Vehicle
CREATE TABLE dbo.Vehicle (
    VehicleID       INT IDENTITY(1,1) PRIMARY KEY,
    AccountID       INT NOT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    ModelID         INT NOT NULL FOREIGN KEY REFERENCES dbo.Model(ModelID),
    VIN             NVARCHAR(100) NOT NULL UNIQUE,
    LicensePlate    NVARCHAR(50)  NOT NULL UNIQUE,
    Year            INT NULL,
    LastServiceDate DATE NULL,
    Color           NVARCHAR(50) NULL,
    Notes           NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2 NULL
);

-- Slot
CREATE TABLE dbo.Slot (
    SlotID     INT IDENTITY(1,1) PRIMARY KEY,
    StaffID    INT NOT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    StartTime  DATETIME2 NOT NULL,
    EndTime    DATETIME2 NOT NULL,
    Capacity   INT NOT NULL DEFAULT 4,
    Status     NVARCHAR(20) NOT NULL DEFAULT 'Free' CHECK (Status IN ('Free','Booked','Cancelled')),
    CreatedAt  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt  DATETIME2 NULL,
    CONSTRAINT CK_Slot_StartEnd CHECK (StartTime < EndTime)
);

-- Appointment
CREATE TABLE dbo.Appointment (
    AppointmentID      INT IDENTITY(1,1) PRIMARY KEY,
    AccountID          INT NOT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    VehicleID          INT NOT NULL FOREIGN KEY REFERENCES dbo.Vehicle(VehicleID),
    SlotID             INT NOT NULL FOREIGN KEY REFERENCES dbo.Slot(SlotID),
    ScheduledDate      DATETIME2 NOT NULL,
    Status             NVARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending','Confirmed','Completed','Cancelled')),
    Notes              NVARCHAR(255) NULL,
    ConfirmedByStaffID INT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    CreatedAt          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2 NULL
);

-- AppointmentTechnician (many-to-many)
CREATE TABLE dbo.AppointmentTechnician (
    AppointmentID INT NOT NULL FOREIGN KEY REFERENCES dbo.Appointment(AppointmentID),
    TechnicianID  INT NOT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    PRIMARY KEY (AppointmentID, TechnicianID)
);

-- ServiceCatalog (service master)
CREATE TABLE dbo.ServiceCatalog (
    ServiceID    INT IDENTITY(1,1) PRIMARY KEY,
    ServiceName  NVARCHAR(100) NOT NULL,
    Description  NVARCHAR(255) NULL,
    StandardCost DECIMAL(18,2) NOT NULL,
    CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt    DATETIME2 NULL
);

-- WorkOrder
CREATE TABLE dbo.WorkOrder (
    WorkOrderID     INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentID   INT NOT NULL FOREIGN KEY REFERENCES dbo.Appointment(AppointmentID),
    TechnicianID    INT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    StartTime       DATETIME2 NULL,
    EndTime         DATETIME2 NULL,
    ProgressStatus  NVARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (ProgressStatus IN ('Pending','InProgress','Done')),
    TotalAmount     DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2 NULL
);

-- WorkOrderDetail
CREATE TABLE dbo.WorkOrderDetail (
    WorkOrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    WorkOrderID       INT NOT NULL FOREIGN KEY REFERENCES dbo.WorkOrder(WorkOrderID),
    ServiceID         INT NOT NULL FOREIGN KEY REFERENCES dbo.ServiceCatalog(ServiceID),
    Quantity          INT NOT NULL CHECK (Quantity > 0),
    UnitPrice         DECIMAL(18,2) NOT NULL DEFAULT 0,
    SubTotal          AS (Quantity * UnitPrice) PERSISTED
);

-- PartInventory
CREATE TABLE dbo.PartInventory (
    PartID      INT IDENTITY(1,1) PRIMARY KEY,
    PartName    NVARCHAR(100) NOT NULL,
    ModelID     INT NOT NULL FOREIGN KEY REFERENCES dbo.Model(ModelID),
    StockQuantity INT NOT NULL DEFAULT 0,
    UnitPrice   DECIMAL(18,2) NOT NULL,
    MinStock    INT NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2 NULL
);

-- PartUsage
CREATE TABLE dbo.PartUsage (
    UsageID        INT IDENTITY(1,1) PRIMARY KEY,
    WorkOrderID    INT NOT NULL FOREIGN KEY REFERENCES dbo.WorkOrder(WorkOrderID),
    PartID         INT NOT NULL FOREIGN KEY REFERENCES dbo.PartInventory(PartID),
    Quantity       INT NOT NULL CHECK (Quantity > 0),
    UnitPrice      DECIMAL(18,2) NULL,
    SuggestedByTech BIT NOT NULL DEFAULT 1,
    ApprovedByStaff BIT NOT NULL DEFAULT 0,
    CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt      DATETIME2 NULL
);

-- Invoice (XOR: by Appointment OR by WorkOrder)
CREATE TABLE dbo.Invoice (
    InvoiceID     INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentID INT NULL FOREIGN KEY REFERENCES dbo.Appointment(AppointmentID),
    WorkOrderID   INT NULL FOREIGN KEY REFERENCES dbo.WorkOrder(WorkOrderID),
    TotalAmount   DECIMAL(18,2) NOT NULL,
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'Unpaid' CHECK (PaymentStatus IN ('Paid','Unpaid')),
    CreatedAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt     DATETIME2 NULL,
    CONSTRAINT CK_Invoice_XOR CHECK (
      (AppointmentID IS NOT NULL AND WorkOrderID IS NULL) OR
      (AppointmentID IS NULL AND WorkOrderID IS NOT NULL)
    )
);

-- PaymentTransaction
CREATE TABLE dbo.PaymentTransaction (
    TransactionID   INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID       INT NOT NULL FOREIGN KEY REFERENCES dbo.Invoice(InvoiceID) ON DELETE CASCADE,
    Amount          DECIMAL(18,2) NOT NULL,
    PaymentDate     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Method          NVARCHAR(50) NOT NULL
        CHECK (Method IN ('VNPAY','eWallet','Banking','CreditCard','Cash')),
    Status          NVARCHAR(20) NOT NULL
        CHECK (Status IN ('Pending','Success','Failed')),
    GatewayRspCode  NVARCHAR(10)  NULL,
    GatewayTxnNo    NVARCHAR(50)  NULL,
    GatewayBankCode NVARCHAR(20)  NULL,
    GatewayPayDate  NVARCHAR(20)  NULL,
    GatewayMeta     NVARCHAR(MAX) NULL,
    CheckoutUrl     NVARCHAR(1000) NULL,   -- để FE lấy lại QR/link nếu cần
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2 NULL
);

-- ChatMessage
CREATE TABLE dbo.ChatMessage (
    MessageID     INT IDENTITY(1,1) PRIMARY KEY,
    FromAccountID INT NOT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    ToAccountID   INT NOT NULL FOREIGN KEY REFERENCES dbo.Account(AccountID),
    Message       NVARCHAR(500) NOT NULL,
    SentTime      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Reminder
CREATE TABLE dbo.Reminder (
    ReminderID   INT IDENTITY(1,1) PRIMARY KEY,
    VehicleID    INT NOT NULL FOREIGN KEY REFERENCES dbo.Vehicle(VehicleID),
    ReminderType NVARCHAR(50) NOT NULL CHECK (ReminderType IN ('Maintenance','Payment')),
    ReminderDate DATETIME2 NOT NULL,
    Status       NVARCHAR(20) NOT NULL CHECK (Status IN ('Sent','Pending')),
    CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt    DATETIME2 NULL
);

-- Indexes
CREATE INDEX IX_WorkOrder_TechnicianID ON dbo.WorkOrder(TechnicianID);
CREATE INDEX IX_Appointment_VehicleID ON dbo.Appointment(VehicleID);
CREATE INDEX IX_PaymentTransaction_Status ON dbo.PaymentTransaction(Status);
CREATE INDEX IX_Slot_StaffID ON dbo.Slot(StaffID);
GO

/* =======================
   Triggers (safe for OUTPUT INTO usage)
   =======================*/

-- Auto reminder 1 day BEFORE service date
CREATE OR ALTER TRIGGER dbo.trg_AutoCreateReminder_OnAppointment
ON dbo.Appointment
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Reminder (VehicleID, ReminderType, ReminderDate, Status)
    SELECT i.VehicleID, 'Maintenance', DATEADD(DAY, -1, i.ScheduledDate), 'Pending'
    FROM inserted i;
END
GO

-- Auto reminder 1 day AFTER invoice created (unpaid)
CREATE OR ALTER TRIGGER dbo.trg_AutoCreateReminder_OnInvoice
ON dbo.Invoice
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Reminder (VehicleID, ReminderType, ReminderDate, Status)
    SELECT v.VehicleID, 'Payment', DATEADD(DAY, 1, i.CreatedAt), 'Pending'
    FROM inserted i
    JOIN dbo.Appointment a ON i.AppointmentID = a.AppointmentID
    JOIN dbo.Vehicle v     ON a.VehicleID = v.VehicleID
    WHERE i.PaymentStatus = 'Unpaid';
END
GO
GO
CREATE OR ALTER TRIGGER trg_RecalcTotal_OnWorkOrderDetail
ON WorkOrderDetail
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  ;WITH A AS (
    SELECT DISTINCT WorkOrderID FROM inserted
    UNION
    SELECT DISTINCT WorkOrderID FROM deleted
  )
  UPDATE wo
  SET TotalAmount = ISNULL(s.SumService,0) + ISNULL(p.SumPart,0)
  FROM WorkOrder wo
  JOIN A ON A.WorkOrderID = wo.WorkOrderID
  OUTER APPLY (
    SELECT SUM(d.Quantity * d.UnitPrice) AS SumService
    FROM WorkOrderDetail d
    WHERE d.WorkOrderID = wo.WorkOrderID
  ) s
  OUTER APPLY (
    SELECT SUM(u.Quantity * ISNULL(u.UnitPrice, pi.UnitPrice)) AS SumPart
    FROM PartUsage u
    LEFT JOIN PartInventory pi ON pi.PartID = u.PartID
    WHERE u.WorkOrderID = wo.WorkOrderID
  ) p;
END
GO

/* =======================
   Views for client progress (JOIN ServiceCatalog)
   =======================*/

IF OBJECT_ID('dbo.vw_WorkOrder_Client','V') IS NOT NULL
    DROP VIEW dbo.vw_WorkOrder_Client;
GO
CREATE VIEW dbo.vw_WorkOrder_Client
AS
SELECT
    wo.WorkOrderID,
    a.AccountID,
    v.LicensePlate,
    -- ghép tên dịch vụ từ WorkOrderDetail + ServiceCatalog
    STRING_AGG(sc.ServiceName, ', ')
        WITHIN GROUP (ORDER BY sc.ServiceName) AS ServiceName,
    wo.ProgressStatus AS Status,
    wo.StartTime      AS StartedAt,
    wo.EndTime        AS CompletedAt,
    CASE wo.ProgressStatus
        WHEN 'Pending'    THEN 0
        WHEN 'InProgress' THEN 60
        WHEN 'Done'       THEN 100
        ELSE 0
    END AS Progress
FROM dbo.WorkOrder wo
JOIN dbo.Appointment a  ON wo.AppointmentID = a.AppointmentID
JOIN dbo.Vehicle v      ON a.VehicleID = v.VehicleID
LEFT JOIN dbo.WorkOrderDetail wod ON wod.WorkOrderID = wo.WorkOrderID
LEFT JOIN dbo.ServiceCatalog  sc  ON sc.ServiceID     = wod.ServiceID
GROUP BY
    wo.WorkOrderID, a.AccountID, v.LicensePlate,
    wo.ProgressStatus, wo.StartTime, wo.EndTime;
GO

IF OBJECT_ID('dbo.vw_WorkOrder_Completed','V') IS NOT NULL
    DROP VIEW dbo.vw_WorkOrder_Completed;
GO
CREATE VIEW dbo.vw_WorkOrder_Completed
AS
SELECT
    wo.WorkOrderID,
    a.AccountID,
    v.LicensePlate,
    STRING_AGG(sc.ServiceName, ', ')
        WITHIN GROUP (ORDER BY sc.ServiceName) AS ServiceName,
    ISNULL(wo.TotalAmount, 0) AS TotalCost,
    ISNULL(CONVERT(varchar(19), wo.EndTime, 126), CONVERT(varchar(19), wo.UpdatedAt, 126)) AS CompletedDate
FROM dbo.WorkOrder wo
JOIN dbo.Appointment a  ON wo.AppointmentID = a.AppointmentID
JOIN dbo.Vehicle v      ON a.VehicleID = v.VehicleID
LEFT JOIN dbo.WorkOrderDetail wod ON wod.WorkOrderID = wo.WorkOrderID
LEFT JOIN dbo.ServiceCatalog  sc  ON sc.ServiceID     = wod.ServiceID
WHERE wo.ProgressStatus = 'Done'
GROUP BY
    wo.WorkOrderID, a.AccountID, v.LicensePlate, wo.TotalAmount, wo.EndTime, wo.UpdatedAt;
GO
USE EVServiceCenterDB;
GO

/* ======================
   ACCOUNT (User demo)
   ====================== */
INSERT INTO Account (Username, PasswordHash, Role, FullName, Phone, Email, Address)
VALUES
('admin',    '$10$htyw6FG8uwKKUf.vUTgaC.QbaJjknKIL4al69QibiSCKXOW.s1/76', 'Admin',      N'Quản trị viên',  '0909000000', 'admin@ev.vn', N'Hà Nội'),
('staff1',   '$10$htyw6FG8uwKKUf.vUTgaC.QbaJjknKIL4al69QibiSCKXOW.s1/76', 'Staff',      N'Nhân viên Lễ tân', '0909000001', 'staff1@ev.vn', N'Hà Nội'),
('tech1',    '$10$htyw6FG8uwKKUf.vUTgaC.QbaJjknKIL4al69QibiSCKXOW.s1/76', 'Technician', N'Kỹ thuật viên A', '0909000002', 'tech1@ev.vn', N'Hà Nội'),
('tech2',    '$10$htyw6FG8uwKKUf.vUTgaC.QbaJjknKIL4al69QibiSCKXOW.s1/76', 'Technician', N'Kỹ thuật viên B', '0909000003', 'tech2@ev.vn', N'Hà Nội'),
('customer1','$10$htyw6FG8uwKKUf.vUTgaC.QbaJjknKIL4al69QibiSCKXOW.s1/76', 'Customer',   N'Khách hàng A', '0909111222', 'khacha@ev.vn', N'Hà Nội');
GO

/* ======================
   MODEL & VEHICLE
   ====================== */
INSERT INTO Model (Brand, ModelName, EngineSpec)
VALUES
('VinFast', 'VF e34', N'Động cơ điện 110kW'),
('VinFast', 'VF 8', N'Động cơ điện 150kW');

INSERT INTO Vehicle (AccountID, ModelID, VIN, LicensePlate, Year, Color, Notes)
VALUES
(5, 1, 'VF1234567890E34', '30A-12345', 2023, N'Xanh dương', N'Xe của khách hàng A'),
(5, 2, 'VF0987654321VF8', '30B-56789', 2024, N'Đỏ', N'Xe thứ 2 của khách hàng A');
GO

/* ======================
   SERVICES (Danh mục dịch vụ)
   ====================== */
INSERT INTO ServiceCatalog (ServiceName, Description, StandardCost)
VALUES
(N'Bảo dưỡng định kỳ 10.000km', N'Kiểm tra tổng thể xe và thay dầu', 1200000),
(N'Thay lốp', N'Thay 4 lốp xe chính hãng', 2500000),
(N'Kiểm tra SOH pin', N'Đánh giá tình trạng pin xe điện', 800000),
(N'Sửa hệ thống điện', N'Kiểm tra và sửa lỗi điện', 1500000);
GO

/* ======================
   SLOT (Ca làm việc)
   ====================== */
INSERT INTO Slot (StaffID, StartTime, EndTime, Capacity, Status)
VALUES
(2, '2025-11-07T08:00:00', '2025-11-07T12:00:00', 4, 'Free'),
(2, '2025-11-07T13:00:00', '2025-11-07T17:00:00', 4, 'Free');
GO

/* ======================
   APPOINTMENT
   ====================== */
INSERT INTO Appointment (AccountID, VehicleID, SlotID, ScheduledDate, Status, Notes, ConfirmedByStaffID)
VALUES
(5, 1, 1, '2025-11-07T09:00:00', 'Confirmed', N'Bảo dưỡng định kỳ', 2),
(5, 2, 2, '2025-11-08T14:00:00', 'Pending', N'Kiểm tra pin xe', NULL);
GO

/* ======================
   WORK ORDER
   ====================== */
INSERT INTO WorkOrder (AppointmentID, TechnicianID, StartTime, EndTime, ProgressStatus, TotalAmount)
VALUES
(1, 3, '2025-11-07T09:00:00', NULL, 'InProgress', 0),
(2, 4, '2025-11-08T14:00:00', NULL, 'Pending', 0);
GO

/* ======================
   WORK ORDER DETAIL
   ====================== */
INSERT INTO WorkOrderDetail (WorkOrderID, ServiceID, Quantity, UnitPrice)
VALUES
(1, 1, 1, 1200000),
(1, 4, 1, 1500000),
(2, 3, 1, 800000);
GO

/* ======================
   INVOICE
   ====================== */
INSERT INTO Invoice (AppointmentID, TotalAmount, PaymentStatus)
VALUES
(1, 2700000, 'Unpaid'),
(2, 800000, 'Unpaid');
GO

/* ======================
   PAYMENT TRANSACTION
   ====================== */
INSERT INTO PaymentTransaction (InvoiceID, Amount, Method, Status)
VALUES
(1, 2700000, 'VNPAY', 'Pending'),
(2, 800000, 'Cash', 'Pending');
GO

INSERT INTO dbo.Account
    (Username, PasswordHash, Role, FullName, Phone, Email, Address, Status)
VALUES
    ('admin1',
     '$2b$10$3qS1rOoTsEUnk5cnFE2HuulEAI2oYTH2ZgrQkn4/ngcyEe6cvZK/i', -- hash bcrypt của 123456
     'Admin',
     N'Quản trị viên test',
     '0909000098',
     'admin_test@ev.vn',
     N'Hà Nội',
     'Active');
     GO
     ALTER TABLE dbo.WorkOrder
ADD
    Diagnosis NVARCHAR(500) NULL,
    EstimatedCompletionTime DATETIME2 NULL;
GO
ALTER TABLE dbo.PartInventory
ADD WarrantyMonths INT NULL;  -- số tháng bảo hành, ví dụ 6, 12, 24 ...

-- Thêm thông tin bảo hành sử dụng cho từng lần dùng phụ tùng
ALTER TABLE dbo.PartUsage
ADD WarrantyMonthsUsed INT NULL,          -- thời hạn bảo hành áp dụng cho lần này
    WarrantyExpireDate DATE NULL;         -- ngày hết hạn bảo hành cho lần thay này
GO