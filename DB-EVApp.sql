-- ============================================
-- EVServiceCenterDB - Final Optimized Schema
-- ============================================

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
    PasswordHash VARBINARY(512) NOT NULL, -- bcrypt hash
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Customer','Staff','Technician','Admin')),
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    Email NVARCHAR(100) NULL,
    Address NVARCHAR(200),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active','Inactive','Banned')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
CREATE UNIQUE INDEX UX_Account_Email ON Account(Email) WHERE Email IS NOT NULL;

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
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active','Inactive')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Slot
CREATE TABLE Slot (
    SlotID INT PRIMARY KEY IDENTITY,
    StaffID INT NOT NULL FOREIGN KEY REFERENCES Account(AccountID),
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2 NOT NULL,
    Capacity INT NOT NULL DEFAULT 4 CHECK (Capacity > 0),
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
    TechnicianID INT NULL FOREIGN KEY REFERENCES Account(AccountID),
    Notes NVARCHAR(255),
    DepositAmount DECIMAL(18,2) NOT NULL DEFAULT 100000,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- ServiceCatalog
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
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
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

-- Indexes (extra for performance)
CREATE INDEX IX_Appointment_AccountID ON Appointment(AccountID);
CREATE INDEX IX_Appointment_SlotID ON Appointment(SlotID);
CREATE INDEX IX_Appointment_VehicleID ON Appointment(VehicleID);

CREATE INDEX IX_WorkOrder_AppointmentID ON WorkOrder(AppointmentID);
CREATE INDEX IX_WorkOrder_TechnicianID ON WorkOrder(TechnicianID);

CREATE INDEX IX_Vehicle_AccountID ON Vehicle(AccountID);

CREATE INDEX IX_PaymentTransaction_Status ON PaymentTransaction(Status);

CREATE INDEX IX_Slot_StaffID ON Slot(StaffID);
