-- ========================
-- 1. Xoá DB cũ (nếu có)
-- ========================
USE master;
GO
IF DB_ID('EVServiceCenterDB') IS NOT NULL
BEGIN
    ALTER DATABASE EVServiceCenterDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE EVServiceCenterDB;
END
GO

-- ========================
-- 2. Tạo DB mới
-- ========================
CREATE DATABASE EVServiceCenterDB;
GO
USE EVServiceCenterDB;
GO

-- ========================
-- 3. Schema
-- ========================

-- 1. Account
CREATE TABLE Account (
    AccountID INT PRIMARY KEY IDENTITY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Customer','Staff','Technician','Admin')),
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    Email NVARCHAR(100) UNIQUE,
    Address NVARCHAR(200),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active','Inactive','Banned')),
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
);

-- 2. Model
CREATE TABLE Model (
    ModelID INT PRIMARY KEY IDENTITY,
    Brand NVARCHAR(100) NOT NULL,
    ModelName NVARCHAR(100) NOT NULL,
    EngineSpec NVARCHAR(200)
);

-- 3. Vehicle
CREATE TABLE Vehicle (
    VehicleID INT PRIMARY KEY IDENTITY,
    AccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    ModelID INT NOT NULL FOREIGN KEY REFERENCES Model(ModelID),
    VIN NVARCHAR(100) UNIQUE NOT NULL,
    LicensePlate NVARCHAR(50) UNIQUE NOT NULL,
    Year INT,
    LastServiceDate DATE
);

-- 4. Slot
CREATE TABLE Slot (
    SlotID INT PRIMARY KEY IDENTITY,
    StaffID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Free','Booked','Cancelled'))
);

-- 5. Appointment
CREATE TABLE Appointment (
    AppointmentID INT PRIMARY KEY IDENTITY,
    AccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    VehicleID INT NOT NULL FOREIGN KEY REFERENCES Vehicle(VehicleID),
    SlotID INT NOT NULL FOREIGN KEY REFERENCES Slot(SlotID),
    ScheduledDate DATETIME NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Pending','Confirmed','Completed','Cancelled')),
    Notes NVARCHAR(255)
);

-- 6. ServiceCatalog
CREATE TABLE ServiceCatalog (
    ServiceID INT PRIMARY KEY IDENTITY,
    ServiceName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    StandardCost DECIMAL(18,2) NOT NULL
);

-- 7. WorkOrder
CREATE TABLE WorkOrder (
    WorkOrderID INT PRIMARY KEY IDENTITY,
    AppointmentID INT NOT NULL FOREIGN KEY REFERENCES Appointment(AppointmentID),
    TechnicianID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    StartTime DATETIME,
    EndTime DATETIME,
    ProgressStatus NVARCHAR(20) NOT NULL CHECK (ProgressStatus IN ('Pending','InProgress','Done')),
    TotalAmount DECIMAL(18,2) DEFAULT 0
);

-- 8. WorkOrderDetail
CREATE TABLE WorkOrderDetail (
    WorkOrderDetailID INT PRIMARY KEY IDENTITY,
    WorkOrderID INT NOT NULL FOREIGN KEY REFERENCES WorkOrder(WorkOrderID),
    ServiceID INT NOT NULL FOREIGN KEY REFERENCES ServiceCatalog(ServiceID),
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18,2) NOT NULL,
    SubTotal AS (Quantity * UnitPrice) PERSISTED
);

-- 9. PartInventory
CREATE TABLE PartInventory (
    PartID INT PRIMARY KEY IDENTITY,
    PartName NVARCHAR(100) NOT NULL,
    ModelID INT NOT NULL FOREIGN KEY REFERENCES Model(ModelID),
    StockQuantity INT NOT NULL DEFAULT 0,
    UnitPrice DECIMAL(18,2) NOT NULL,
    MinStock INT DEFAULT 0
);

-- 10. PartUsage
CREATE TABLE PartUsage (
    UsageID INT PRIMARY KEY IDENTITY,
    WorkOrderID INT NOT NULL FOREIGN KEY REFERENCES WorkOrder(WorkOrderID),
    PartID INT NOT NULL FOREIGN KEY REFERENCES PartInventory(PartID),
    Quantity INT NOT NULL CHECK (Quantity > 0),
    SuggestedByTech BIT DEFAULT 1,
    ApprovedByStaff BIT DEFAULT 0
);

-- 11. Invoice
CREATE TABLE Invoice (
    InvoiceID INT PRIMARY KEY IDENTITY,
    WorkOrderID INT NOT NULL FOREIGN KEY REFERENCES WorkOrder(WorkOrderID),
    TotalAmount DECIMAL(18,2) NOT NULL,
    PaymentStatus NVARCHAR(20) NOT NULL CHECK (PaymentStatus IN ('Paid','Unpaid'))
);

-- 12. PaymentTransaction (InvoiceID có thể NULL)
CREATE TABLE PaymentTransaction (
    TransactionID INT PRIMARY KEY IDENTITY,
    InvoiceID INT NULL FOREIGN KEY REFERENCES Invoice(InvoiceID),
    Amount DECIMAL(18,2) NOT NULL,
    PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
    Method NVARCHAR(50) NOT NULL CHECK (Method IN ('eWallet','Banking','CreditCard','Cash')),
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Success','Failed','Pending'))
);

-- 13. ChatMessage
CREATE TABLE ChatMessage (
    MessageID INT PRIMARY KEY IDENTITY,
    FromAccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    ToAccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    Message NVARCHAR(500) NOT NULL,
    SentTime DATETIME NOT NULL DEFAULT GETDATE()
);

-- 14. Reminder
CREATE TABLE Reminder (
    ReminderID INT PRIMARY KEY IDENTITY,
    VehicleID INT NOT NULL FOREIGN KEY REFERENCES Vehicle(VehicleID),
    ReminderType NVARCHAR(50) NOT NULL CHECK (ReminderType IN ('Maintenance','Payment')),
    ReminderDate DATETIME NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Sent','Pending'))
);
GO

-- ========================
-- 4. Trigger
-- ========================
CREATE TRIGGER trg_Appointment_Deposit
ON Appointment
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO PaymentTransaction (InvoiceID, Amount, Method, Status)
    SELECT NULL, 100000, 'eWallet', 'Success'
    FROM inserted;
END;
GO
-- Trigger khi thêm/sửa/xoá WorkOrderDetail
CREATE TRIGGER trg_UpdateTotal_WorkOrderDetail
ON WorkOrderDetail
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE w
    SET w.TotalAmount = ISNULL(d.ServiceTotal,0) + ISNULL(p.PartTotal,0)
    FROM WorkOrder w
    LEFT JOIN (
        SELECT WorkOrderID, SUM(SubTotal) AS ServiceTotal
        FROM WorkOrderDetail
        GROUP BY WorkOrderID
    ) d ON w.WorkOrderID = d.WorkOrderID
    LEFT JOIN (
        SELECT pu.WorkOrderID, SUM(pu.Quantity * pi.UnitPrice) AS PartTotal
        FROM PartUsage pu
        JOIN PartInventory pi ON pu.PartID = pi.PartID
        GROUP BY pu.WorkOrderID
    ) p ON w.WorkOrderID = p.WorkOrderID;
END;
GO

-- Trigger khi thêm/sửa/xoá PartUsage
CREATE TRIGGER trg_UpdateTotal_PartUsage
ON PartUsage
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE w
    SET w.TotalAmount = ISNULL(d.ServiceTotal,0) + ISNULL(p.PartTotal,0)
    FROM WorkOrder w
    LEFT JOIN (
        SELECT WorkOrderID, SUM(SubTotal) AS ServiceTotal
        FROM WorkOrderDetail
        GROUP BY WorkOrderID
    ) d ON w.WorkOrderID = d.WorkOrderID
    LEFT JOIN (
        SELECT pu.WorkOrderID, SUM(pu.Quantity * pi.UnitPrice) AS PartTotal
        FROM PartUsage pu
        JOIN PartInventory pi ON pu.PartID = pi.PartID
        GROUP BY pu.WorkOrderID
    ) p ON w.WorkOrderID = p.WorkOrderID;
END;
GO

-- ========================
-- 5. Sample Data
-- ========================

-- Accounts
INSERT INTO Account (Username, PasswordHash, Role, FullName, Email, Status)
VALUES 
('admin', '123456hash', 'Admin', N'Admin User', 'admin@example.com', 'Active'),
('customer1', '123456hash', 'Customer', N'Nguyen Van A', 'customer1@example.com', 'Active'),
('staff1', '123456hash', 'Staff', N'Le Van B', 'staff1@example.com', 'Active'),
('tech1', '123456hash', 'Technician', N'Tran Van C', 'tech1@example.com', 'Active');

-- Model
INSERT INTO Model (Brand, ModelName, EngineSpec)
VALUES (N'Toyota', N'Camry', N'2.0L Petrol');

-- Vehicle (của customer1)
INSERT INTO Vehicle (AccountID, ModelID, VIN, LicensePlate, Year)
VALUES (2, 1, 'VIN123456789', '30A-12345', 2020);

-- Slot (của staff1)
INSERT INTO Slot (StaffID, StartTime, EndTime, Status)
VALUES (3, '2025-09-25 08:00', '2025-09-25 10:00', 'Free');

-- Appointment (trigger sẽ tạo PaymentTransaction 100k)
INSERT INTO Appointment (AccountID, VehicleID, SlotID, ScheduledDate, Status)
VALUES (2, 1, 1, GETDATE(), 'Pending');

-- Service
INSERT INTO ServiceCatalog (ServiceName, Description, StandardCost)
VALUES 
(N'Bảo dưỡng định kỳ', N'Kiểm tra xe định kỳ', 500000),
(N'Thay dầu máy', N'Dầu nhớt chính hãng', 300000);

-- Part
INSERT INTO PartInventory (PartName, ModelID, StockQuantity, UnitPrice, MinStock)
VALUES (N'Lọc dầu', 1, 50, 200000, 5);

-- Tạo WorkOrder mẫu
INSERT INTO WorkOrder (AppointmentID, TechnicianID, ProgressStatus)
VALUES (1, 4, 'Pending');

-- Thêm chi tiết dịch vụ
INSERT INTO WorkOrderDetail (WorkOrderID, ServiceID, Quantity, UnitPrice)
VALUES (1, 1, 1, 500000); -- Bảo dưỡng định kỳ

-- Thêm phụ tùng
INSERT INTO PartUsage (WorkOrderID, PartID, Quantity)
VALUES (1, 1, 2); -- 2 lọc dầu, đơn giá lấy từ PartInventory.UnitPrice = 200000
-- ========================
-- 6. Kiểm tra nhanh
-- ========================
SELECT * FROM Account;
SELECT * FROM Vehicle;
SELECT * FROM Slot;
SELECT * FROM Appointment;
SELECT * FROM PaymentTransaction;
SELECT * FROM WorkOrder;