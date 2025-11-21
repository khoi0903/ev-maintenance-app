// src/services/appointmentService.js
const { poolPromise, sql } = require('../db');
const appointmentRepository = require('../repositories/appointmentRepository');
const workOrderRepository = require('../repositories/workOrderRepository');
const accountRepository = require('../repositories/accountRepository');
const serviceCatalogRepository = require('../repositories/serviceCatalogRepository');

const MAX_ACTIVE_WORKORDERS_PER_TECH = 5;

// ================= LIST / GET MINE =================

async function listAll({ scope }) {
  // scope hiện giờ chưa dùng gì đặc biệt, nhưng để sẵn
  const pool = await poolPromise;
  const rs = await pool.request().query(`
    SELECT 
      a.AppointmentID,
      a.AccountID,
      acc.FullName      AS CustomerName,
      acc.Phone,
      acc.Email,
      a.VehicleID,
      v.LicensePlate,
      a.SlotID,
      a.ScheduledDate,
      a.Status,
      a.Notes,
      a.ConfirmedByStaffID,
      s.StaffID,
      staff.FullName    AS StaffName,
      a.ServiceID,
      sc.ServiceName,                     -- ✅ tên dịch vụ
      a.CreatedAt,
      a.UpdatedAt
    FROM dbo.Appointment a
      JOIN dbo.Account acc   ON a.AccountID = acc.AccountID
      JOIN dbo.Vehicle v     ON a.VehicleID = v.VehicleID
      JOIN dbo.Slot s        ON a.SlotID    = s.SlotID
      JOIN dbo.Account staff ON s.StaffID   = staff.AccountID
      LEFT JOIN dbo.ServiceCatalog sc ON a.ServiceID = sc.ServiceID  -- ✅ join dịch vụ
    ORDER BY a.ScheduledDate DESC, a.AppointmentID DESC;
  `);

  return rs.recordset;
}

async function getMine(accountId) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('accountId', sql.Int, accountId)
    .query(`
      SELECT 
        a.AppointmentID,
        a.AccountID,
        a.VehicleID,
        a.SlotID,
        a.ScheduledDate,
        a.Status,
        a.Notes,
        a.ServiceID,
        sc.ServiceName,
        v.LicensePlate,
        m.ModelName,
        a.CreatedAt,
        a.UpdatedAt
      FROM dbo.Appointment a
      JOIN dbo.Vehicle v ON a.VehicleID = v.VehicleID
      JOIN dbo.Model   m ON v.ModelID   = m.ModelID
      LEFT JOIN dbo.ServiceCatalog sc ON a.ServiceID = sc.ServiceID
      WHERE a.AccountID = @accountId
      ORDER BY a.ScheduledDate DESC, a.AppointmentID DESC;
    `);
  return rs.recordset;
}


// ================= CREATE APPOINTMENT =================


async function create(payload) {
  const pool = await poolPromise;

  // ==== LẤY THÔNG TIN CHUNG ====
  const accountId =
    payload.accountId ??
    payload.AccountID ??
    payload.AccountId;

  const serviceId =
    payload.serviceId ??
    payload.ServiceID ??
    payload.serviceID ??
    null;

  const scheduledDateRaw =
    payload.scheduledDate ??
    payload.PreferredDateTime; // FE đang gửi PreferredDateTime

  const notes = payload.notes ?? payload.Notes ?? null;

  if (!accountId) {
    const err = new Error('Thiếu thông tin tài khoản');
    err.statusCode = 400;
    throw err;
  }
  if (!serviceId) {
    const err = new Error('Thiếu dịch vụ (ServiceID)');
    err.statusCode = 400;
    throw err;
  }
  if (!scheduledDateRaw) {
    const err = new Error('Thiếu thời gian đặt lịch');
    err.statusCode = 400;
    throw err;
  }

  const preferred = new Date(scheduledDateRaw);
  if (Number.isNaN(preferred.getTime())) {
    const err = new Error('Thời gian đặt lịch không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  // ==== LẤY THÔNG TIN XE (VIN / Biển số / VehicleID) ====
  const vehicleRaw =
    payload.vehicleVin ??
    payload.vin ??
    payload.VIN ??
    payload.vehicle ??
    payload.licensePlate ??
    payload.LicensePlate ??
    payload.plate ??
    payload.vehicleId ??
    payload.VehicleID ??
    null;

  if (!vehicleRaw) {
    const err = new Error('Thiếu thông tin xe');
    err.statusCode = 400;
    throw err;
  }

  const vehicleText = String(vehicleRaw).trim();

  // 1. Thử VIN hoặc biển số
  let vehicleRs = await pool.request()
    .input('text', sql.NVarChar(100), vehicleText)
    .query(`
      SELECT TOP 1 VehicleID, AccountID
      FROM dbo.Vehicle
      WHERE VIN = @text OR LicensePlate = @text;
    `);

  // 2. Nếu không có, và chuỗi toàn số -> thử VehicleID
  if (!vehicleRs.recordset[0] && /^[0-9]+$/.test(vehicleText)) {
    vehicleRs = await pool.request()
      .input('id', sql.Int, Number(vehicleText))
      .query(`
        SELECT VehicleID, AccountID
        FROM dbo.Vehicle
        WHERE VehicleID = @id;
      `);
  }

  const vehicle = vehicleRs.recordset[0];
  if (!vehicle) {
    const err = new Error('Không tìm thấy xe với VIN / biển số / ID này');
    err.statusCode = 400;
    throw err;
  }

  if (vehicle.AccountID !== accountId) {
    const err = new Error('Xe không thuộc sở hữu của tài khoản này');
    err.statusCode = 403;
    throw err;
  }

  // ==== SLOT: ĐỂ REPOSITORY TỰ XỬ LÝ ====
  // Nếu sau này FE gửi sẵn SlotID thì vẫn cho đi qua
  const slotIdFromPayload =
    payload.slotId ??
    payload.SlotID ??
    payload.SlotId ??
    null;

  // 🟢 Gọi repository: nó sẽ tự tìm / tạo Slot dựa trên scheduledDate
  const appointmentId = await appointmentRepository.create({
    accountId,
    vehicleId: vehicle.VehicleID,
    slotId: slotIdFromPayload,     // thường là null cho flow customer
    scheduledDate: preferred,
    notes,
    serviceId,
  });

  // Lấy lại đầy đủ thông tin cho FE
  const appointment = await appointmentRepository.getById(appointmentId);
  return appointment;
}






// ================= SIMPLE CONFIRM =================

async function simpleConfirm({ appointmentId, staffId }) {
  const pool = await poolPromise;

  // check tồn tại & trạng thái
  const rs = await pool.request()
    .input('AppointmentID', sql.Int, appointmentId)
    .query(`
      SELECT Status
      FROM dbo.Appointment
      WHERE AppointmentID = @AppointmentID
    `);

  if (!rs.recordset[0]) {
    const err = new Error('Lịch hẹn không tồn tại');
    err.statusCode = 404;
    throw err;
  }

  const currentStatus = rs.recordset[0].Status;
  if (currentStatus !== 'Pending') {
    const err = new Error('Chỉ có thể xác nhận lịch hẹn Pending');
    err.statusCode = 400;
    throw err;
  }

  await pool.request()
    .input('AppointmentID', sql.Int, appointmentId)
    .input('StaffID', sql.Int, staffId)
    .query(`
      UPDATE dbo.Appointment
      SET 
        Status = 'Confirmed',
        ConfirmedByStaffID = @StaffID,
        UpdatedAt = SYSUTCDATETIME()
      WHERE AppointmentID = @AppointmentID
    `);

  return { AppointmentID: appointmentId, Status: 'Confirmed' };
}

// ================= CONFIRM WITH TECHNICIAN =================

async function confirmWithTechnician(appointmentId, technicianId, staffId) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    // 1. Lấy thông tin appointment (kèm ServiceID, SlotID)
    const apptRs = await new sql.Request(transaction)
      .input('AppointmentID', sql.Int, appointmentId)
      .query(`
        SELECT 
          a.AppointmentID,
          a.AccountID,
          a.VehicleID,
          a.SlotID,
          a.Status,
          a.Notes,
          a.ServiceID
        FROM dbo.Appointment a
        WHERE a.AppointmentID = @AppointmentID
      `);

    const appointment = apptRs.recordset[0];

    if (!appointment) {
      const err = new Error('Lịch hẹn không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    if (appointment.Status !== 'Pending') {
      const err = new Error('Chỉ có thể xác nhận các lịch hẹn đang Pending');
      err.statusCode = 400;
      throw err;
    }

    // 2. Kiểm tra workload & trùng slot cho kỹ thuật viên
    const workloadRs = await new sql.Request(transaction)
      .input('TechnicianID', sql.Int, technicianId)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM dbo.WorkOrder
        WHERE TechnicianID = @TechnicianID
          AND ProgressStatus IN ('Pending','InProgress')
      `);

    const currentJobs = workloadRs.recordset[0]?.cnt || 0;
    if (currentJobs >= MAX_ACTIVE_WORKORDERS_PER_TECH) {
      const err = new Error('Kỹ thuật viên đang có quá nhiều việc, vui lòng chọn người khác');
      err.statusCode = 400;
      throw err;
    }

    if (appointment.SlotID) {
      const conflictRs = await new sql.Request(transaction)
        .input('TechnicianID', sql.Int, technicianId)
        .input('SlotID', sql.Int, appointment.SlotID)
        .query(`
          SELECT TOP 1 wo.WorkOrderID
          FROM dbo.WorkOrder wo
          JOIN dbo.Appointment a ON a.AppointmentID = wo.AppointmentID
          WHERE wo.TechnicianID = @TechnicianID
            AND a.SlotID = @SlotID
            AND wo.ProgressStatus IN ('Pending','InProgress','Confirmed');
        `);

      if (conflictRs.recordset.length > 0) {
        const err = new Error('Kỹ thuật viên đã có lịch ở ca này, vui lòng chọn người khác');
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Cập nhật Appointment -> Confirmed + người xác nhận
    await new sql.Request(transaction)
      .input('AppointmentID', sql.Int, appointmentId)
      .input('StaffID', sql.Int, staffId || null)
      .query(`
        UPDATE dbo.Appointment
        SET Status = 'Confirmed',
            ConfirmedByStaffID = COALESCE(@StaffID, ConfirmedByStaffID),
            UpdatedAt = SYSUTCDATETIME()
        WHERE AppointmentID = @AppointmentID;
      `);

    // 4. Tạo WorkOrder
    const woRs = await new sql.Request(transaction)
      .input('AppointmentID', sql.Int, appointmentId)
      .input('TechnicianID', sql.Int, technicianId)
      .query(`
        INSERT INTO dbo.WorkOrder (AppointmentID, TechnicianID, StartTime, ProgressStatus, TotalAmount)
        OUTPUT INSERTED.*
        VALUES (@AppointmentID, @TechnicianID, NULL, 'Pending', 0);
      `);

    const workOrder = woRs.recordset[0];

    // 5. Nếu lịch hẹn có ServiceID thì tạo luôn WorkOrderDetail với UnitPrice
    if (appointment.ServiceID) {
      const svcRs = await new sql.Request(transaction)
        .input('ServiceID', sql.Int, appointment.ServiceID)
        .query(`
          SELECT TOP 1 ServiceID, StandardCost
          FROM dbo.ServiceCatalog
          WHERE ServiceID = @ServiceID
        `);

      const svc = svcRs.recordset[0] || {};
      const unitPrice =
        svc.StandardCost !== null && svc.StandardCost !== undefined
          ? Number(svc.StandardCost)
          : 0; // fallback 0 để không bị NULL

      await new sql.Request(transaction)
        .input('WorkOrderID', sql.Int, workOrder.WorkOrderID)
        .input('ServiceID', sql.Int, appointment.ServiceID)
        .input('Quantity', sql.Int, 1)
        .input('UnitPrice', sql.Decimal(18, 2), unitPrice)
        .query(`
          INSERT INTO dbo.WorkOrderDetail (WorkOrderID, ServiceID, Quantity, UnitPrice)
          VALUES (@WorkOrderID, @ServiceID, @Quantity, @UnitPrice);
        `);
    }

    await transaction.commit();

    return {
      appointmentId,
      workOrderId: workOrder.WorkOrderID,
      technicianId,
    };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      console.error('[appointments/confirmWithTechnician] rollback error:', rollbackErr);
    }
    console.error('[appointments/confirmWithTechnician] error:', err);
    throw err;
  }
}


// ================= CANCEL =================

async function cancel({ appointmentId, actorId, actorRole }) {
  const pool = await poolPromise;

  await pool.request()
    .input('AppointmentID', sql.Int, appointmentId)
    .input('ActorID', sql.Int, actorId)
    .input('ActorRole', sql.NVarChar(50), actorRole)
    .query(`
      UPDATE dbo.Appointment
      SET 
        Status = 'Cancelled',
        UpdatedAt = SYSUTCDATETIME()
      WHERE AppointmentID = @AppointmentID;
    `);

  return { AppointmentID: appointmentId, Status: 'Cancelled' };
}

module.exports = {
  listAll,
  getMine,
  create,
  simpleConfirm,
  confirmWithTechnician,
  cancel,
};
