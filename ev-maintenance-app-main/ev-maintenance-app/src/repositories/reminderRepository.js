// src/repositories/reminderRepository.js
// Quản lý Reminder (DB trigger tự sinh; repo chỉ đọc/cập nhật)
const { poolPromise, sql } = require("../db");

class ReminderRepository {
  async getAll() {
    const pool = await poolPromise;
    const r = await pool.request()
      .query("SELECT * FROM Reminder ORDER BY ReminderDate DESC");
    return r.recordset;
  }

  // ✅ bổ sung lấy danh sách Pending
  async getPending() {
    const pool = await poolPromise;
    const r = await pool.request()
      .query(`
        SELECT * 
        FROM Reminder 
        WHERE Status = 'Pending'
        ORDER BY ReminderDate ASC
      `);
    return r.recordset;
  }

  async getByVehicleId(vehicleId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .query(`
        SELECT * 
        FROM Reminder 
        WHERE VehicleID = @VehicleID 
        ORDER BY ReminderDate DESC
      `);
    return r.recordset;
  }

  // ✅ đổi tên đúng với service/controller: markAsSent
  async markAsSent(reminderId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("ReminderID", sql.Int, reminderId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Reminder 
        SET Status = 'Sent', UpdatedAt = @updatedAt 
        OUTPUT INSERTED.*
        WHERE ReminderID = @ReminderID
      `);
    return r.recordset[0];
  }

  // Tạo reminder thủ công (nếu cần)
  async create({ VehicleID, ReminderType, ReminderDate, Status = "Pending" }) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("VehicleID", sql.Int, VehicleID)
      .input("ReminderType", sql.NVarChar(50), ReminderType)
      .input("ReminderDate", sql.DateTime2, ReminderDate)
      .input("Status", sql.NVarChar(20), Status)
      .query(`
        INSERT INTO Reminder (VehicleID, ReminderType, ReminderDate, Status, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@VehicleID, @ReminderType, @ReminderDate, @Status, SYSUTCDATETIME())
      `);
    return r.recordset[0];
  }
}

module.exports = new ReminderRepository();
