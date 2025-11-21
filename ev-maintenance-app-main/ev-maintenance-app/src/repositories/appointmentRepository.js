const { poolPromise, sql } = require('../db');

class AppointmentRepository {
  // 🟢 Helper: tìm hoặc tạo Slot dựa trên ScheduledDate
  async ensureSlotForDateTime(scheduledDate) {
    const pool = await poolPromise;

    // 1) Tìm slot có cùng StartTime (nếu bạn muốn theo Staff riêng thì thêm điều kiện StaffID)
    let rs = await pool.request()
      .input('StartTime', sql.DateTime2, scheduledDate)
      .query(`
        SELECT TOP 1 SlotID
        FROM dbo.Slot
        WHERE StartTime = @StartTime
      `);

    if (rs.recordset[0]?.SlotID) {
      return rs.recordset[0].SlotID;
    }

    // 2) Lấy 1 Staff bất kỳ (active) để gán cho Slot mới
    rs = await pool.request()
      .query(`
        SELECT TOP 1 AccountID
        FROM dbo.Account
        WHERE Role = 'Staff' AND Status = 'Active'
        ORDER BY AccountID
      `);

    const staffId = rs.recordset[0]?.AccountID;
    if (!staffId) {
      throw new Error('Hệ thống chưa có nhân viên Staff nào để gán Slot');
    }

    // 3) Tạo Slot mới với StaffID, StartTime, EndTime, Capacity, Status
    rs = await pool.request()
      .input('StaffID', sql.Int, staffId)
      .input('StartTime', sql.DateTime2, scheduledDate)
      .query(`
        DECLARE @EndTime DATETIME2 = DATEADD(MINUTE, 60, @StartTime);

        INSERT INTO dbo.Slot (StaffID, StartTime, EndTime, Capacity, Status)
        VALUES (@StaffID, @StartTime, @EndTime, 4, 'Free');

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS SlotID;
      `);

    return rs.recordset[0]?.SlotID;
  }

  // 🟢 Tạo Appointment: nếu không truyền slotId thì tự tạo Slot từ ScheduledDate
  async create({ accountId, vehicleId, slotId, scheduledDate, notes, serviceId }) {
    const pool = await poolPromise;

    // Nếu FE không truyền slotId → tự tạo dựa trên ScheduledDate
    let finalSlotId = slotId || null;
    if (!finalSlotId) {
      if (!scheduledDate) {
        throw new Error('scheduledDate is required to create Slot for this Appointment');
      }
      finalSlotId = await this.ensureSlotForDateTime(scheduledDate);
    }

    const req = pool.request();
    req.input('AccountID', sql.Int, accountId);
    req.input('VehicleID', sql.Int, vehicleId);
    req.input('SlotID', sql.Int, finalSlotId);              // ✅ luôn có SlotID hợp lệ
    req.input('ScheduledDate', sql.DateTime2, scheduledDate);
    req.input('Notes', sql.NVarChar(sql.MAX), notes);
    req.input('ServiceID', sql.Int, serviceId ?? null);

    const q = `
      INSERT INTO Appointment (AccountID, VehicleID, SlotID, ScheduledDate, Status, Notes, ServiceID, CreatedAt)
      VALUES (@AccountID, @VehicleID, @SlotID, @ScheduledDate, 'Pending', @Notes, @ServiceID, SYSUTCDATETIME());
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS AppointmentID;
    `;
    const rs = await req.query(q);
    return rs.recordset[0]?.AppointmentID;
  }

  async countUsedBySlot(slotId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('SlotID', sql.Int, slotId)
      .query(`SELECT COUNT(*) AS cnt FROM Appointment WHERE SlotID=@SlotID AND Status <> 'Cancelled'`);
    return rs.recordset[0]?.cnt || 0;
  }

  async getAllByAccount(accountId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query(`
        SELECT 
          a.*,
          v.VIN,
          v.LicensePlate,
          v.ModelID,
          v.Color,
          sc.ServiceName,
          s.StartTime,
          s.EndTime
        FROM Appointment a
        JOIN Vehicle v ON v.VehicleID = a.VehicleID
        LEFT JOIN ServiceCatalog sc ON sc.ServiceID = a.ServiceID
        LEFT JOIN Slot s ON s.SlotID = a.SlotID
        WHERE a.AccountID=@AccountID
        ORDER BY a.ScheduledDate DESC
      `);
    return rs.recordset || [];
  }

  async getById(id) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('AppointmentID', sql.Int, id)
      .query(`
        SELECT 
          a.AppointmentID,
          a.AccountID,
          a.VehicleID,
          a.SlotID,
          a.ScheduledDate,
          a.Status,
          a.ServiceID,
          a.Notes,
          a.ConfirmedByStaffID,
          v.VIN,
          v.LicensePlate,
          sc.ServiceName
        FROM Appointment a
        JOIN Vehicle v ON v.VehicleID = a.VehicleID
        LEFT JOIN ServiceCatalog sc ON sc.ServiceID = a.ServiceID
        WHERE a.AppointmentID = @AppointmentID
      `);
    return rs.recordset[0] || null;
  }

  async listAll({ status, accountId } = {}) {
    const pool = await poolPromise;
    const req = pool.request();
    const conds = [];
    if (status) {
      req.input('Status', sql.NVarChar(20), status);
      conds.push('a.Status = @Status');
    }
    if (accountId) {
      req.input('AccountID', sql.Int, accountId);
      conds.push('a.AccountID = @AccountID');
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rs = await req.query(`
      SELECT 
        a.AppointmentID,
        a.AccountID,
        a.VehicleID,
        a.SlotID,
        a.ScheduledDate,
        a.Status,
        a.Notes,
        a.ServiceID,
        a.CreatedAt,
        a.UpdatedAt,
        a.ConfirmedByStaffID,
        acc.FullName   AS AccountName,
        acc.Phone      AS AccountPhone,
        acc.Email      AS AccountEmail,
        v.VIN,
        v.LicensePlate,
        v.ModelID,
        v.Color,
        s.StartTime,
        s.EndTime,
        s.Capacity,
        sc.ServiceName
      FROM Appointment a
      JOIN Account acc ON acc.AccountID = a.AccountID
      JOIN Vehicle v   ON v.VehicleID   = a.VehicleID
      LEFT JOIN Slot s ON s.SlotID      = a.SlotID
      LEFT JOIN ServiceCatalog sc ON sc.ServiceID = a.ServiceID
      ${where}
      ORDER BY a.ScheduledDate DESC
    `);
    return rs.recordset || [];
  }

  async confirm(id, staffId) {
    const pool = await poolPromise;
    await pool.request()
      .input('AppointmentID', sql.Int, id)
      .input('StaffID', sql.Int, staffId)
      .query(`
        UPDATE Appointment 
        SET Status='Confirmed', 
            ConfirmedByStaffID=@StaffID, 
            UpdatedAt=SYSUTCDATETIME() 
        WHERE AppointmentID=@AppointmentID
      `);
    return true;
  }

  async cancel(id) {
    const pool = await poolPromise;
    await pool.request()
      .input('AppointmentID', sql.Int, id)
      .query(`
        UPDATE Appointment 
        SET Status='Cancelled', 
            UpdatedAt=SYSUTCDATETIME() 
        WHERE AppointmentID=@AppointmentID
      `);
    return true;
  }

  async getByAccount(accountId) {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query(`
        SELECT 
          a.AppointmentID,
          a.AccountID,
          a.ServiceID,
          a.VehicleID,
          a.ScheduledDate,
          a.Status,
          a.Notes,
          a.SlotID,
          s.StartTime AS SlotStart,
          s.EndTime   AS SlotEnd,
          sc.ServiceName,
          sc.StandardCost,
          v.LicensePlate,
          v.VIN
        FROM dbo.Appointment a
        LEFT JOIN dbo.Slot s ON a.SlotID = s.SlotID
        LEFT JOIN dbo.ServiceCatalog sc ON a.ServiceID = sc.ServiceID
        LEFT JOIN dbo.Vehicle v ON a.VehicleID = v.VehicleID
        WHERE a.AccountID = @AccountID
        ORDER BY a.ScheduledDate DESC, a.AppointmentID DESC
      `);

    return result.recordset;
  }
}

module.exports = new AppointmentRepository();
