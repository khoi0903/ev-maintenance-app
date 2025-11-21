// src/repositories/workOrderRepository.js
const { poolPromise, sql } = require('../db');

// =======================
// 0. Helper: tạo/update Invoice cho WorkOrder
// =======================

async function ensureInvoiceForWorkOrder(workOrderId) {
  const pool = await poolPromise;

  // 1. Lấy TotalAmount từ WorkOrder (đã được trigger tự động tính)
  const woRs = await pool.request()
    .input('WorkOrderID', sql.Int, workOrderId)
    .query(`
      SELECT WorkOrderID, AppointmentID, ISNULL(TotalAmount, 0) AS TotalAmount
      FROM dbo.WorkOrder
      WHERE WorkOrderID = @WorkOrderID;
    `);

  const wo = woRs.recordset[0];
  if (!wo) {
    console.error(`❌ Không tìm thấy WorkOrder #${workOrderId}`);
    return null;
  }

  const totalAmount = wo.TotalAmount;

  // 2. Check xem đã có Invoice chưa
  const existingRs = await pool.request()
    .input('WorkOrderID', sql.Int, workOrderId)
    .query(`
      SELECT TOP 1 InvoiceID, TotalAmount, PaymentStatus
      FROM dbo.Invoice
      WHERE WorkOrderID = @WorkOrderID;
    `);

  const existing = existingRs.recordset[0];

  if (!existing) {
    // 2a. Chưa có -> INSERT mới với OUTPUT INTO
    const insertRs = await pool.request()
      .input('WorkOrderID', sql.Int, workOrderId)
      .input('TotalAmount', sql.Decimal(18, 2), totalAmount)
      .query(`
        DECLARE @OutputTable TABLE (
          InvoiceID INT,
          AppointmentID INT,
          WorkOrderID INT,
          TotalAmount DECIMAL(18,2),
          PaymentStatus NVARCHAR(20),
          CreatedAt DATETIME2
        );
        
        INSERT INTO dbo.Invoice
          (AppointmentID, WorkOrderID, TotalAmount, PaymentStatus, CreatedAt)
        OUTPUT 
          INSERTED.InvoiceID,
          INSERTED.AppointmentID,
          INSERTED.WorkOrderID,
          INSERTED.TotalAmount,
          INSERTED.PaymentStatus,
          INSERTED.CreatedAt
        INTO @OutputTable
        VALUES
          (NULL, @WorkOrderID, @TotalAmount, 'Unpaid', SYSDATETIME());
        
        SELECT * FROM @OutputTable;
      `);
    
    const newInvoice = insertRs.recordset[0];
    console.log(`✅ Đã tạo Invoice mới #${newInvoice.InvoiceID} cho WorkOrder #${workOrderId}, TotalAmount: ${totalAmount} VND`);
    return newInvoice;
  } else {
    // 2b. Có rồi -> chỉ update TotalAmount (giữ nguyên PaymentStatus)
    await pool.request()
      .input('WorkOrderID', sql.Int, workOrderId)
      .input('TotalAmount', sql.Decimal(18, 2), totalAmount)
      .query(`
        UPDATE dbo.Invoice
        SET TotalAmount = @TotalAmount,
            UpdatedAt = SYSDATETIME()
        WHERE WorkOrderID = @WorkOrderID;
      `);
    
    console.log(`✅ Đã cập nhật Invoice #${existing.InvoiceID} cho WorkOrder #${workOrderId}, TotalAmount: ${totalAmount} VND`);
    return existing;
  }
}

// =======================
// 1. WorkOrder cho CUSTOMER & TECHNICIAN
// =======================

async function getMyActiveWorkOrders(accountId) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('accountId', sql.Int, accountId)
    .query(`
      SELECT
        wo.WorkOrderID,
        a.AccountID,
        acc.FullName AS CustomerName,
        acc.Phone    AS CustomerPhone,
        v.LicensePlate,
        v.VIN,
        ISNULL(scAgg.ServiceNameList, N'Dịch vụ EV Maintenance') AS ServiceName,
        wo.ProgressStatus AS Status,
        wo.StartTime AS StartedAt,
        CASE wo.ProgressStatus
          WHEN 'Pending'    THEN 0
          WHEN 'InProgress' THEN 60
          WHEN 'Done'       THEN 100
          ELSE 0
        END AS Progress
      FROM dbo.WorkOrder wo
      JOIN dbo.Appointment a ON wo.AppointmentID = a.AppointmentID
      JOIN dbo.Vehicle     v ON a.VehicleID      = v.VehicleID
      JOIN dbo.Account     acc ON a.AccountID    = acc.AccountID
      OUTER APPLY (
        SELECT STRING_AGG(sc.ServiceName, ', ')
          WITHIN GROUP (ORDER BY sc.ServiceName) AS ServiceNameList
        FROM dbo.WorkOrderDetail wod
        JOIN dbo.ServiceCatalog sc ON sc.ServiceID = wod.ServiceID
        WHERE wod.WorkOrderID = wo.WorkOrderID
      ) scAgg
      WHERE
        (a.AccountID = @accountId OR wo.TechnicianID = @accountId)
        AND wo.ProgressStatus IN ('Pending','InProgress')
      ORDER BY wo.StartTime DESC, wo.WorkOrderID DESC;
    `);

  return rs.recordset;
}

async function getMyCompletedWorkOrders(accountId) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('accountId', sql.Int, accountId)
    .query(`
      SELECT
        wo.WorkOrderID,
        a.AccountID,
        acc.FullName AS CustomerName,
        acc.Phone    AS CustomerPhone,
        v.LicensePlate,
        v.VIN,
        ISNULL(scAgg.ServiceNameList, N'Dịch vụ EV Maintenance') AS ServiceName,
        ISNULL(wo.TotalAmount, 0) AS TotalAmount,
        wo.EndTime AS CompletedAt
      FROM dbo.WorkOrder wo
      JOIN dbo.Appointment a ON wo.AppointmentID = a.AppointmentID
      JOIN dbo.Vehicle     v ON a.VehicleID      = v.VehicleID
      JOIN dbo.Account     acc ON a.AccountID    = acc.AccountID
      OUTER APPLY (
        SELECT STRING_AGG(sc.ServiceName, ', ')
          WITHIN GROUP (ORDER BY sc.ServiceName) AS ServiceNameList
        FROM dbo.WorkOrderDetail wod
        JOIN dbo.ServiceCatalog sc ON sc.ServiceID = wod.ServiceID
        WHERE wod.WorkOrderID = wo.WorkOrderID
      ) scAgg
      WHERE
        (a.AccountID = @accountId OR wo.TechnicianID = @accountId)
        AND wo.ProgressStatus IN ('Done','Completed')
      ORDER BY wo.EndTime DESC, wo.WorkOrderID DESC;
    `);

  return rs.recordset;
}

async function getMyWorkOrderDetail(workOrderId, accountId) {
  const pool = await poolPromise;

  // Header
  const headerRs = await pool.request()
    .input('workOrderId', sql.Int, workOrderId)
    .input('accountId', sql.Int, accountId)
    .query(`
      SELECT
        wo.WorkOrderID,
        wo.AppointmentID,
        a.AccountID,
        acc.FullName AS CustomerName,
        acc.Phone    AS CustomerPhone,
        v.VehicleID,
        v.LicensePlate,
        v.VIN,
        ISNULL(scAgg.ServiceNameList, N'Dịch vụ EV Maintenance') AS ServiceName,
        wo.TechnicianID,
        tech.FullName AS TechnicianName,
        wo.ProgressStatus AS Status,
        wo.StartTime  AS StartedAt,
        wo.EndTime    AS CompletedAt,
        wo.EstimatedCompletionTime,
        wo.Diagnosis,
        wo.TotalAmount,
        wo.CreatedAt,
        wo.UpdatedAt
      FROM dbo.WorkOrder wo
      JOIN dbo.Appointment a ON wo.AppointmentID = a.AppointmentID
      JOIN dbo.Vehicle     v ON a.VehicleID      = v.VehicleID
      JOIN dbo.Account     acc ON a.AccountID    = acc.AccountID
      LEFT JOIN dbo.Account tech ON wo.TechnicianID = tech.AccountID
      OUTER APPLY (
        SELECT STRING_AGG(sc.ServiceName, ', ')
          WITHIN GROUP (ORDER BY sc.ServiceName) AS ServiceNameList
        FROM dbo.WorkOrderDetail wod
        JOIN dbo.ServiceCatalog sc ON sc.ServiceID = wod.ServiceID
        WHERE wod.WorkOrderID = wo.WorkOrderID
      ) scAgg
      WHERE
        wo.WorkOrderID = @workOrderId
        AND (a.AccountID = @accountId OR wo.TechnicianID = @accountId);
    `);

  const header = headerRs.recordset[0];
  if (!header) return null;

  // Dịch vụ
  const serviceRs = await pool.request()
    .input('workOrderId', sql.Int, workOrderId)
    .query(`
      SELECT
        wod.WorkOrderDetailID,
        wod.WorkOrderID,
        wod.ServiceID,
        sc.ServiceName,
        wod.Quantity,
        wod.UnitPrice,
        wod.SubTotal
      FROM dbo.WorkOrderDetail wod
      JOIN dbo.ServiceCatalog sc ON sc.ServiceID = wod.ServiceID
      WHERE wod.WorkOrderID = @workOrderId
      ORDER BY wod.WorkOrderDetailID;
    `);

  // Phụ tùng
  const partRs = await pool.request()
    .input('workOrderId', sql.Int, workOrderId)
    .query(`
      SELECT
        u.UsageID,
        u.WorkOrderID,
        u.PartID,
        p.PartName,
        u.Quantity,
        ISNULL(u.UnitPrice, p.UnitPrice) AS UnitPrice,
        u.Quantity * ISNULL(u.UnitPrice, p.UnitPrice) AS SubTotal,
        u.SuggestedByTech,
        u.ApprovedByStaff,
        u.WarrantyMonthsUsed,
        u.WarrantyExpireDate
      FROM dbo.PartUsage u
      JOIN dbo.PartInventory p ON p.PartID = u.PartID
      WHERE u.WorkOrderID = @workOrderId
      ORDER BY u.UsageID;
    `);

  // Invoice (nếu có)
  const invoiceRs = await pool.request()
    .input('workOrderId', sql.Int, workOrderId)
    .query(`
      SELECT TOP 1
        i.InvoiceID,
        i.AppointmentID,
        i.WorkOrderID,
        i.TotalAmount,
        i.PaymentStatus,
        i.CreatedAt,
        i.UpdatedAt
      FROM dbo.Invoice i
      WHERE i.WorkOrderID = @workOrderId
      ORDER BY i.InvoiceID DESC;
    `);

  const invoice = invoiceRs.recordset[0] || null;

  return {
    ...header,
    ServiceDetails: serviceRs.recordset,
    Parts: partRs.recordset,
    Invoice: invoice,
  };
}

// =======================
// 2. Admin/Staff – list + CRUD
// =======================

async function listAllWorkOrders() {
  const pool = await poolPromise;
  const rs = await pool.request().query(`
    SELECT
      wo.WorkOrderID,
      wo.AppointmentID,
      a.AccountID,
      acc.FullName AS CustomerName,
      v.LicensePlate,
      ISNULL(scAgg.ServiceNameList, N'Dịch vụ EV Maintenance') AS ServiceName,
      wo.EstimatedCompletionTime,
      wo.Diagnosis,
      wo.TechnicianID,
      tech.FullName AS TechnicianName,
      wo.ProgressStatus AS Status,
      wo.StartTime,
      wo.EndTime,
      wo.TotalAmount,
      wo.CreatedAt,
      wo.UpdatedAt
    FROM dbo.WorkOrder wo
    JOIN dbo.Appointment a ON wo.AppointmentID = a.AppointmentID
    JOIN dbo.Vehicle     v ON a.VehicleID      = v.VehicleID
    JOIN dbo.Account     acc ON a.AccountID    = acc.AccountID
    LEFT JOIN dbo.Account tech ON wo.TechnicianID = tech.AccountID
    OUTER APPLY (
      SELECT STRING_AGG(sc.ServiceName, ', ')
        WITHIN GROUP (ORDER BY sc.ServiceName) AS ServiceNameList
      FROM dbo.WorkOrderDetail wod
      JOIN dbo.ServiceCatalog sc ON sc.ServiceID = wod.ServiceID
      WHERE wod.WorkOrderID = wo.WorkOrderID
    ) scAgg
    ORDER BY wo.CreatedAt DESC, wo.WorkOrderID DESC;
  `);

  return rs.recordset;
}

async function getWorkOrderById(workOrderId) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('workOrderId', sql.Int, workOrderId)
    .query(`
      SELECT
        wo.WorkOrderID,
        wo.AppointmentID,
        wo.TechnicianID,
        wo.StartTime,
        wo.EndTime,
        wo.EstimatedCompletionTime,
        wo.Diagnosis,
        wo.ProgressStatus,
        wo.TotalAmount,
        wo.CreatedAt,
        wo.UpdatedAt
      FROM dbo.WorkOrder wo
      WHERE wo.WorkOrderID = @workOrderId;
    `);

  return rs.recordset[0] || null;
}

async function createWorkOrder(data) {
  const pool = await poolPromise;
  const { AppointmentID, TechnicianID, StartTime } = data;

  // ✅ FIX: Sử dụng OUTPUT INTO để tránh lỗi trigger
  const rs = await pool.request()
    .input('AppointmentID', sql.Int, AppointmentID)
    .input('TechnicianID', sql.Int, TechnicianID || null)
    .input('StartTime', sql.DateTime2, StartTime || null)
    .query(`
      DECLARE @OutputTable TABLE (
        WorkOrderID INT,
        AppointmentID INT,
        TechnicianID INT,
        StartTime DATETIME2,
        ProgressStatus NVARCHAR(20),
        TotalAmount DECIMAL(18,2),
        CreatedAt DATETIME2
      );
      
      INSERT INTO dbo.WorkOrder
        (AppointmentID, TechnicianID, StartTime, ProgressStatus, TotalAmount)
      OUTPUT 
        INSERTED.WorkOrderID,
        INSERTED.AppointmentID,
        INSERTED.TechnicianID,
        INSERTED.StartTime,
        INSERTED.ProgressStatus,
        INSERTED.TotalAmount,
        INSERTED.CreatedAt
      INTO @OutputTable
      VALUES
        (@AppointmentID, @TechnicianID, @StartTime, 'Pending', 0);
      
      SELECT * FROM @OutputTable;
    `);

  return rs.recordset[0];
}

async function createFromAppointment({ appointmentId, technicianId }) {
  return createWorkOrder({
    AppointmentID: appointmentId,
    TechnicianID: technicianId,
    StartTime: null,
  });
}

async function addServiceDetail(workOrderId, serviceId, quantity, unitPrice) {
  const pool = await poolPromise;

  const rs = await pool.request()
    .input('WorkOrderID', sql.Int, workOrderId)
    .input('ServiceID', sql.Int, serviceId)
    .input('Quantity', sql.Int, quantity)
    .input('UnitPrice', sql.Decimal(18, 2), unitPrice)
    .query(`
      INSERT INTO dbo.WorkOrderDetail (WorkOrderID, ServiceID, Quantity, UnitPrice)
      VALUES (@WorkOrderID, @ServiceID, @Quantity, @UnitPrice);

      SELECT TOP 1 *
      FROM dbo.WorkOrderDetail
      WHERE WorkOrderDetailID = SCOPE_IDENTITY();
    `);

  // Trigger sẽ tự động cập nhật TotalAmount trong WorkOrder
  return rs.recordset[0];
}

async function deleteServiceDetail(detailId) {
  const pool = await poolPromise;
  await pool.request()
    .input('detailId', sql.Int, detailId)
    .query(`
      DELETE FROM dbo.WorkOrderDetail
      WHERE WorkOrderDetailID = @detailId;
    `);
  
  // Trigger sẽ tự động cập nhật TotalAmount
}

async function addPartUsage(workOrderId, partId, quantity, unitPrice) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const request = transaction.request()
      .input('WorkOrderID', sql.Int, workOrderId)
      .input('PartID', sql.Int, partId)
      .input('Quantity', sql.Int, quantity)
      .input('UnitPrice', sql.Decimal(18, 2), unitPrice || null);

    // Attempt to decrement stock only if sufficient quantity exists
    const updateStockQuery = `
      UPDATE dbo.PartInventory
      SET StockQuantity = StockQuantity - @Quantity,
          UpdatedAt = SYSDATETIME()
      WHERE PartID = @PartID AND StockQuantity >= @Quantity;
    `;

    const updateResult = await request.query(updateStockQuery);
    if (updateResult.rowsAffected[0] === 0) {
      // No rows updated -> either part not found or not enough stock
      await transaction.rollback();
      throw new Error('Phụ tùng không đủ tồn kho hoặc không tồn tại')
    }

    // Insert PartUsage record within the same transaction
    const insertQuery = `
      DECLARE @OutputTable TABLE (
        UsageID INT,
        WorkOrderID INT,
        PartID INT,
        Quantity INT,
        UnitPrice DECIMAL(18,2),
        SuggestedByTech BIT,
        ApprovedByStaff BIT,
        CreatedAt DATETIME2
      );

      INSERT INTO dbo.PartUsage
        (WorkOrderID, PartID, Quantity, UnitPrice, SuggestedByTech, ApprovedByStaff)
      OUTPUT 
        INSERTED.UsageID,
        INSERTED.WorkOrderID,
        INSERTED.PartID,
        INSERTED.Quantity,
        INSERTED.UnitPrice,
        INSERTED.SuggestedByTech,
        INSERTED.ApprovedByStaff,
        INSERTED.CreatedAt
      INTO @OutputTable
      VALUES
        (@WorkOrderID, @PartID, @Quantity, @UnitPrice, 1, 0);

      SELECT * FROM @OutputTable;
    `;

    const insertRs = await request.query(insertQuery);

    await transaction.commit();
    // Trigger sẽ tự động cập nhật TotalAmount
    return insertRs.recordset[0];
  } catch (err) {
    try { await transaction.rollback(); } catch (e) { /* ignore */ }
    throw err;
  }
}

async function deletePartUsageById(usageId) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = transaction.request().input('UsageID', sql.Int, usageId);

    // Read the usage record
    const usageRs = await req.query(`
      SELECT UsageID, WorkOrderID, PartID, Quantity
      FROM dbo.PartUsage
      WHERE UsageID = @UsageID;
    `);

    const usage = usageRs.recordset[0];
    if (!usage) {
      await transaction.rollback();
      throw new Error('PartUsage không tồn tại');
    }

    // Attach PartID and Quantity parameters for the subsequent stock restore query
    req.input('PartID', sql.Int, usage.PartID)
       .input('Quantity', sql.Int, usage.Quantity);

    // Delete the PartUsage
    await req.query(`
      DELETE FROM dbo.PartUsage
      WHERE UsageID = @UsageID;
    `);

    // Restore stock
    const restoreRs = await req.query(`
      UPDATE dbo.PartInventory
      SET StockQuantity = StockQuantity + @Quantity,
          UpdatedAt = SYSDATETIME()
      WHERE PartID = @PartID;
    `);

    if (restoreRs.rowsAffected[0] === 0) {
      // Inventory record missing - rollback to avoid inconsistency
      await transaction.rollback();
      throw new Error('Không thể phục hồi tồn kho: PartInventory không tồn tại');
    }

    await transaction.commit();
    return { success: true };
  } catch (err) {
    try { await transaction.rollback(); } catch (e) { /* ignore */ }
    throw err;
  }
}

async function getPartUsageById(usageId) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('UsageID', sql.Int, usageId)
    .query(`
      SELECT UsageID, WorkOrderID, PartID, Quantity
      FROM dbo.PartUsage
      WHERE UsageID = @UsageID;
    `);
  return rs.recordset[0] || null;
}

// ✅ FIX: Hàm update WorkOrder - hỗ trợ đầy đủ các field
async function updateWorkOrder(id, data) {
  const pool = await poolPromise;
  const request = pool.request().input('id', sql.Int, id);

  const updates = [];

  // Map tất cả các field có thể update
  if (data.ProgressStatus !== undefined) {
    request.input('ProgressStatus', sql.NVarChar(50), data.ProgressStatus);
    updates.push('ProgressStatus = @ProgressStatus');
  }
  if (data.Diagnosis !== undefined) {
    request.input('Diagnosis', sql.NVarChar(500), data.Diagnosis);
    updates.push('Diagnosis = @Diagnosis');
  }
  if (data.TechnicianID !== undefined) {
    request.input('TechnicianID', sql.Int, data.TechnicianID);
    updates.push('TechnicianID = @TechnicianID');
  }
  if (data.StartTime !== undefined) {
    request.input('StartTime', sql.DateTime2, data.StartTime);
    updates.push('StartTime = @StartTime');
  }
  if (data.EndTime !== undefined) {
    request.input('EndTime', sql.DateTime2, data.EndTime);
    updates.push('EndTime = @EndTime');
  }
  if (data.EstimatedCompletionTime !== undefined) {
    request.input('EstimatedCompletionTime', sql.DateTime2, data.EstimatedCompletionTime);
    updates.push('EstimatedCompletionTime = @EstimatedCompletionTime');
  }

  // Luôn update UpdatedAt
  updates.push('UpdatedAt = SYSDATETIME()');

  if (updates.length === 1) {
    // Chỉ có UpdatedAt -> không cần update gì
    const rs = await request.query(`
      SELECT TOP 1 * FROM dbo.WorkOrder WHERE WorkOrderID = @id;
    `);
    return rs.recordset[0];
  }

  const rs = await request.query(`
    UPDATE dbo.WorkOrder
    SET ${updates.join(', ')}
    WHERE WorkOrderID = @id;

    SELECT TOP 1 * FROM dbo.WorkOrder WHERE WorkOrderID = @id;
  `);

  const workOrder = rs.recordset[0];

  // ✅ Nếu WorkOrder đã Done -> tạo/cập nhật Invoice
  if (workOrder && workOrder.ProgressStatus === 'Done') {
    console.log(`🔔 WorkOrder #${id} đã Done, đang tạo/cập nhật Invoice...`);
    try {
      await ensureInvoiceForWorkOrder(id);
    } catch (invoiceError) {
      console.error(`❌ Lỗi khi tạo Invoice cho WorkOrder #${id}:`, invoiceError);
      // Không throw lỗi để không làm fail toàn bộ update
    }
  }

  return workOrder;
}

// =======================
// 3. Hỗ trợ chọn technician
// =======================

async function countActiveByTechnician(technicianId) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('TechnicianID', sql.Int, technicianId)
    .query(`
      SELECT COUNT(*) AS cnt
      FROM dbo.WorkOrder
      WHERE TechnicianID = @TechnicianID
        AND ProgressStatus IN ('Pending','InProgress');
    `);
  return rs.recordset[0]?.cnt || 0;
}

async function hasSlotConflict({ technicianId, slotId }) {
  if (!slotId) return false;
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('TechnicianID', sql.Int, technicianId)
    .input('SlotID', sql.Int, slotId)
    .query(`
      SELECT TOP 1 wo.WorkOrderID
      FROM dbo.WorkOrder wo
      JOIN dbo.Appointment a ON a.AppointmentID = wo.AppointmentID
      WHERE wo.TechnicianID = @TechnicianID
        AND a.SlotID = @SlotID
        AND wo.ProgressStatus IN ('Pending','InProgress','Done','Completed');
    `);
  return rs.recordset.length > 0;
}

module.exports = {
  getMyActiveWorkOrders,
  getMyCompletedWorkOrders,
  getMyWorkOrderDetail,
  listAllWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  createFromAppointment,
  addServiceDetail,
  deleteServiceDetail,
  addPartUsage,
  deletePartUsageById,
  getPartUsageById,
  updateWorkOrder,
  countActiveByTechnician,
  hasSlotConflict,
  ensureInvoiceForWorkOrder,
};