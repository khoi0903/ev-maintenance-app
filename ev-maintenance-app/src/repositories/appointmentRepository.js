// src/repositories/appointmentRepository.js
// Repository Appointment: create with slot-lock, get by filters, assign technician
// Sử dụng poolPromise + transaction để tránh overbooking

const { poolPromise, sql } = require("../db");

class AppointmentRepository {
  // Lấy appointment theo id (kèm thông tin cơ bản)
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

  // Lấy theo filter tổng quát
  async getAll({ accountId, status } = {}) {
    const pool = await poolPromise;
    let sqlText = `
      SELECT a.*, v.LicensePlate, acc.FullName AS CustomerName
      FROM Appointment a
      LEFT JOIN Vehicle v ON a.VehicleID = v.VehicleID
      LEFT JOIN Account acc ON a.AccountID = acc.AccountID
      WHERE 1=1
    `;
    if (accountId) sqlText += ` AND a.AccountID = ${parseInt(accountId,10)}`;
    if (status) sqlText += ` AND a.Status = '${status}'`;
    sqlText += ` ORDER BY a.ScheduledDate DESC`;
    const r = await pool.request().query(sqlText);
    return r.recordset;
  }

  // Lấy theo customer
  async getByCustomerId(customerId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AccountID", sql.Int, customerId)
      .query(`
        SELECT * FROM Appointment WHERE AccountID = @AccountID ORDER BY ScheduledDate DESC
      `);
    return r.recordset;
  }

  // Lấy theo technician (qua bảng liên kết)
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

  // Tạo appointment có kiểm tra capacity (transaction + SERIALIZABLE)
  async createAppointment({ AccountID, VehicleID, SlotID, ScheduledDate, Notes, DepositAmount }) {
    const pool = await poolPromise;
    const trx = new sql.Transaction(pool);

    try {
      await trx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      const req = new sql.Request(trx);

      // Khóa row slot và đếm appointment
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
      if (CurrentCount >= Capacity) {
        throw new Error("Slot đã đầy, vui lòng chọn khung giờ khác.");
      }

      // Insert appointment
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

  // Confirm appointment (set ConfirmedByStaffID)
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

  // Gán technician (chèn vào bảng AppointmentTechnician nếu chưa có)
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

  // Tìm technician khả dụng (đơn giản: lấy tech ít workorder đang làm nhất)
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

  // Cập nhật trạng thái appointment
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
}

module.exports = new AppointmentRepository();
