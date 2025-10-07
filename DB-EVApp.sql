-- =============================================
-- EVServiceCenterDB (Node.js friendly version)
-- =============================================

USE master;
IF DB_ID('EVServiceCenterDB') IS NOT NULL
BEGIN
    ALTER DATABASE EVServiceCenterDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE EVServiceCenterDB;
END
GO

CREATE DATABASE EVServiceCenterDB;
GO
USE EVServiceCenterDB;
GO

-- Account
CREATE TABLE Account (
    AccountID INT PRIMARY KEY IDENTITY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL, -- bcrypt string
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Customer','Staff','Technician','Admin')),
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    Email NVARCHAR(100) NULL,
    Address NVARCHAR(200),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active','Inactive','Banned')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Model
CREATE TABLE Model (
    ModelID INT PRIMARY KEY IDENTITY,
    Brand NVARCHAR(100) NOT NULL,
    ModelName NVARCHAR(100) NOT NULL,
    EngineSpec NVARCHAR(200),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Vehicle
CREATE TABLE Vehicle (
    VehicleID INT PRIMARY KEY IDENTITY,
    AccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    ModelID INT NOT NULL FOREIGN KEY REFERENCES Model(ModelID),
    VIN NVARCHAR(100) UNIQUE NOT NULL,
    LicensePlate NVARCHAR(50) UNIQUE NOT NULL,
    Year INT,
    LastServiceDate DATE,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Slot
CREATE TABLE Slot (
    SlotID INT PRIMARY KEY IDENTITY,
    StaffID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2 NOT NULL,
    Capacity INT NOT NULL DEFAULT 4,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Free' CHECK (Status IN ('Free','Booked','Cancelled')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT CK_Slot_StartEnd CHECK (StartTime < EndTime)
);

-- Appointment
CREATE TABLE Appointment (
    AppointmentID INT PRIMARY KEY IDENTITY,
    AccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    VehicleID INT NOT NULL FOREIGN KEY REFERENCES Vehicle(VehicleID),
    SlotID INT NOT NULL FOREIGN KEY REFERENCES Slot(SlotID),
    ScheduledDate DATETIME2 NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending','Confirmed','Completed','Cancelled')),
    Notes NVARCHAR(255),
    DepositAmount DECIMAL(18,2) NOT NULL DEFAULT 100000,
    ConfirmedByStaffID INT NULL FOREIGN KEY REFERENCES Account(AccountID),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- AppointmentTechnician
CREATE TABLE AppointmentTechnician (
    AppointmentID INT NOT NULL FOREIGN KEY REFERENCES Appointment(AppointmentID),
    TechnicianID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    PRIMARY KEY (AppointmentID, TechnicianID)
);

-- ServiceCatalog (danh mục dịch vụ chuẩn)
CREATE TABLE ServiceCatalog (
    ServiceID INT PRIMARY KEY IDENTITY,
    ServiceName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    StandardCost DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- WorkOrder
CREATE TABLE WorkOrder (
    WorkOrderID INT PRIMARY KEY IDENTITY,
    AppointmentID INT NOT NULL FOREIGN KEY REFERENCES Appointment(AppointmentID),
    TechnicianID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    StartTime DATETIME2,
    EndTime DATETIME2,
    ProgressStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (ProgressStatus IN ('Pending','InProgress','Done')),
    TotalAmount DECIMAL(18,2) DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- WorkOrderDetail (chi tiết dịch vụ đã chọn)
CREATE TABLE WorkOrderDetail (
    WorkOrderDetailID INT PRIMARY KEY IDENTITY,
    WorkOrderID INT NOT NULL FOREIGN KEY REFERENCES WorkOrder(WorkOrderID),
    ServiceID INT NOT NULL FOREIGN KEY REFERENCES ServiceCatalog(ServiceID),
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    SubTotal AS (Quantity * UnitPrice) PERSISTED
);

-- PartInventory
CREATE TABLE PartInventory (
    PartID INT PRIMARY KEY IDENTITY,
    PartName NVARCHAR(100) NOT NULL,
    ModelID INT NOT NULL FOREIGN KEY REFERENCES Model(ModelID),
    StockQuantity INT NOT NULL DEFAULT 0,
    UnitPrice DECIMAL(18,2) NOT NULL,
    MinStock INT DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- PartUsage
CREATE TABLE PartUsage (
    UsageID INT PRIMARY KEY IDENTITY,
    WorkOrderID INT NOT NULL FOREIGN KEY REFERENCES WorkOrder(WorkOrderID),
    PartID INT NOT NULL FOREIGN KEY REFERENCES PartInventory(PartID),
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18,2) NULL,
    SuggestedByTech BIT DEFAULT 1,
    ApprovedByStaff BIT DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Invoice
CREATE TABLE Invoice (
    InvoiceID INT PRIMARY KEY IDENTITY,
    AppointmentID INT NULL FOREIGN KEY REFERENCES Appointment(AppointmentID),
    WorkOrderID INT NULL FOREIGN KEY REFERENCES WorkOrder(WorkOrderID),
    TotalAmount DECIMAL(18,2) NOT NULL,
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'Unpaid' CHECK (PaymentStatus IN ('Paid','Unpaid')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT CK_Invoice_XOR CHECK (
        (AppointmentID IS NOT NULL AND WorkOrderID IS NULL)
        OR (AppointmentID IS NULL AND WorkOrderID IS NOT NULL)
    )
);

-- PaymentTransaction
CREATE TABLE PaymentTransaction (
    TransactionID INT PRIMARY KEY IDENTITY,
    InvoiceID INT NOT NULL FOREIGN KEY REFERENCES Invoice(InvoiceID),
    Amount DECIMAL(18,2) NOT NULL,
    PaymentDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Method NVARCHAR(50) NOT NULL CHECK (Method IN ('eWallet','Banking','CreditCard','Cash')),
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Success','Failed','Pending')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- ChatMessage
CREATE TABLE ChatMessage (
    MessageID INT PRIMARY KEY IDENTITY,
    FromAccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    ToAccountID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    Message NVARCHAR(500) NOT NULL,
    SentTime DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Reminder
CREATE TABLE Reminder (
    ReminderID INT PRIMARY KEY IDENTITY,
    VehicleID INT NOT NULL FOREIGN KEY REFERENCES Vehicle(VehicleID),
    ReminderType NVARCHAR(50) NOT NULL CHECK (ReminderType IN ('Maintenance','Payment')),
    ReminderDate DATETIME2 NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Sent','Pending')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Indexes bổ sung
CREATE INDEX IX_WorkOrder_TechnicianID ON WorkOrder(TechnicianID);
CREATE INDEX IX_Appointment_VehicleID ON Appointment(VehicleID);
CREATE INDEX IX_PaymentTransaction_Status ON PaymentTransaction(Status);
CREATE INDEX IX_Slot_StaffID ON Slot(StaffID);
GO
