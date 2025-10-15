// src/repositories/appointmentRepository.js (patched)
const { poolPromise, sql } = require("../db");

class AppointmentRepository {
  async getById(appointmentId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AppointmentID", sql.Int, appointmentId)
      .query(`
        SELECT a.*, v.LicensePlate, acc.FullName AS CustomerName
        FROM Appointment a
        LEFT JOIN Vehicle v ON a.VehicleID = v.VehicleID
        LEFT JOIN Account acc ON a.AccountID = acc.AccountID
        WHERE a.AppointmentID = @AppointmentID
      `);
    return r.recordset[0];
  }

  async getAll({ accountId, status } = {}) {
    const pool = await poolPromise;
    const req = pool.request();
    let where = "WHERE 1=1";
    if (accountId) { req.input("AccountID", sql.Int, accountId); where += " AND a.AccountID = @AccountID"; }
    if (status)    { req.input("Status", sql.NVarChar(20), status); where += " AND a.Status = @Status"; }
    const q = `
      SELECT a.*, v.LicensePlate, acc.FullName AS CustomerName
      FROM Appointment a
      LEFT JOIN Vehicle v ON a.VehicleID = v.VehicleID
      LEFT JOIN Account acc ON a.AccountID = acc.AccountID
      ${where}
      ORDER BY a.ScheduledDate DESC`;
    const r = await req.query(q);
    return r.recordset;
  }

  async getAllByAccount(accountId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AccountID", sql.Int, accountId)
      .query(`
        SELECT a.*, v.LicensePlate, acc.FullName AS CustomerName
        FROM Appointment a
        LEFT JOIN Vehicle v ON a.VehicleID = v.VehicleID
        LEFT JOIN Account acc ON a.AccountID = acc.AccountID
        WHERE a.AccountID = @AccountID
        ORDER BY a.ScheduledDate DESC
      `);
    return r.recordset;
  }

  async getByCustomerId(customerId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AccountID", sql.Int, customerId)
      .query(`
        SELECT * FROM Appointment WHERE AccountID = @AccountID ORDER BY ScheduledDate DESC
      `);
    return r.recordset;
  }

  async getByTechnicianId(technicianId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("TechID", sql.Int, technicianId)
      .query(`
        SELECT a.* FROM Appointment a
        JOIN AppointmentTechnician t ON a.AppointmentID = t.AppointmentID
        WHERE t.TechnicianID = @TechID
        ORDER BY a.ScheduledDate DESC
      `);
    return r.recordset;
  }

  async createAppointment({ AccountID, VehicleID, SlotID, ScheduledDate, Notes, DepositAmount }) {
    const pool = await poolPromise;
    const trx = new sql.Transaction(pool);
    try {
      await trx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      const req = new sql.Request(trx);
      const slotCheck = await req
        .input("SlotID", sql.Int, SlotID)
        .query(`
          SELECT s.SlotID, s.Capacity, 
                 (SELECT COUNT(*) FROM Appointment a WHERE a.SlotID = s.SlotID AND a.Status <> 'Cancelled') AS CurrentCount
          FROM Slot s
          WHERE s.SlotID = @SlotID
        `);
      if (!slotCheck.recordset[0]) throw new Error("Slot không tồn tại");
      const { Capacity, CurrentCount } = slotCheck.recordset[0];
      if (CurrentCount >= Capacity) throw new Error("Slot đã đầy, vui lòng chọn khung giờ khác.");

      const inserted = await req
        .input("AccountID", sql.Int, AccountID)
        .input("VehicleID", sql.Int, VehicleID)
        .input("SlotID", sql.Int, SlotID)
        .input("ScheduledDate", sql.DateTime2, ScheduledDate)
        .input("Notes", sql.NVarChar(255), Notes || null)
        .input("DepositAmount", sql.Decimal(18,2), DepositAmount || 100000)
        .query(`
          INSERT INTO Appointment (AccountID, VehicleID, SlotID, ScheduledDate, Notes, DepositAmount, CreatedAt)
          OUTPUT INSERTED.*
          VALUES (@AccountID, @VehicleID, @SlotID, @ScheduledDate, @Notes, @DepositAmount, SYSUTCDATETIME())
        `);

      await trx.commit();
      return inserted.recordset[0];
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async confirmAppointment(appointmentId, staffId) {
    const pool = await poolPromise;
    await pool.request()
      .input("AppointmentID", sql.Int, appointmentId)
      .input("StaffID", sql.Int, staffId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Appointment
        SET Status = 'Confirmed', ConfirmedByStaffID = @StaffID, UpdatedAt = @updatedAt
        WHERE AppointmentID = @AppointmentID
      `);
    return this.getById(appointmentId);
  }

  async assignTechnician(appointmentId, technicianId) {
    const pool = await poolPromise;
    await pool.request()
      .input("AppointmentID", sql.Int, appointmentId)
      .input("TechnicianID", sql.Int, technicianId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM AppointmentTechnician WHERE AppointmentID=@AppointmentID AND TechnicianID=@TechnicianID)
        BEGIN
          INSERT INTO AppointmentTechnician (AppointmentID, TechnicianID) VALUES (@AppointmentID, @TechnicianID)
        END
      `);
  }

  async findAvailableTechnician() {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT a.AccountID, a.FullName, ISNULL(w.Cnt,0) AS ActiveCount
      FROM Account a
      LEFT JOIN (
        SELECT TechnicianID, COUNT(*) AS Cnt FROM WorkOrder WHERE ProgressStatus <> 'Done' GROUP BY TechnicianID
      ) w ON w.TechnicianID = a.AccountID
      WHERE a.Role = 'Technician' AND a.Status = 'Active'
      ORDER BY ActiveCount ASC, a.AccountID ASC
    `);
    return r.recordset[0];
  }

  async updateStatus(appointmentId, status) {
    const pool = await poolPromise;
    await pool.request()
      .input("AppointmentID", sql.Int, appointmentId)
      .input("Status", sql.NVarChar(20), status)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Appointment SET Status=@Status, UpdatedAt=@updatedAt WHERE AppointmentID=@AppointmentID
      `);
  }

  async cancelAppointment(appointmentId) {
    return this.updateStatus(appointmentId, 'Cancelled');
  }
}

module.exports = new AppointmentRepository();
