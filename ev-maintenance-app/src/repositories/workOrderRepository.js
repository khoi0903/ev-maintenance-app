// src/repositories/workOrderRepository.js
// Quản lý WorkOrder + tổng tiền
const { poolPromise, sql } = require("../db");

class WorkOrderRepository {
  async createWorkOrder({ AppointmentID, TechnicianID }) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AppointmentID", sql.Int, AppointmentID)
      .input("TechnicianID", sql.Int, TechnicianID)
      .query(`
        INSERT INTO WorkOrder (AppointmentID, TechnicianID, ProgressStatus, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@AppointmentID, @TechnicianID, 'Pending', SYSUTCDATETIME())
      `);
    return r.recordset[0];
  }

  async getById(id) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("WorkOrderID", sql.Int, id)
      .query("SELECT * FROM WorkOrder WHERE WorkOrderID = @WorkOrderID");
    return r.recordset[0];
  }

  async getAll() {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT w.*, a.ScheduledDate, t.FullName AS TechnicianName
      FROM WorkOrder w
      LEFT JOIN Appointment a ON w.AppointmentID = a.AppointmentID
      LEFT JOIN Account t ON w.TechnicianID = t.AccountID
      ORDER BY w.CreatedAt DESC
    `);
    return r.recordset;
  }

  async updateProgress(workOrderId, progressStatus) {
    const pool = await poolPromise;
    await pool.request()
      .input("WorkOrderID", sql.Int, workOrderId)
      .input("ProgressStatus", sql.NVarChar(20), progressStatus)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE WorkOrder SET ProgressStatus = @ProgressStatus, UpdatedAt = @updatedAt WHERE WorkOrderID = @WorkOrderID
      `);
  }

  // Tính tổng từ WorkOrderDetail và PartUsage
  async calculateTotals(workOrderId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("WorkOrderID", sql.Int, workOrderId)
      .query(`
        SELECT
          (SELECT ISNULL(SUM(Quantity * UnitPrice),0) FROM WorkOrderDetail WHERE WorkOrderID = @WorkOrderID) AS ServiceTotal,
          (SELECT ISNULL(SUM(Quantity * UnitPrice),0) FROM PartUsage WHERE WorkOrderID = @WorkOrderID) AS PartTotal
      `);
    const row = r.recordset[0] || { ServiceTotal: 0, PartTotal: 0 };
    const total = (row.ServiceTotal || 0) + (row.PartTotal || 0);
    return { serviceTotal: row.ServiceTotal, partTotal: row.PartTotal, totalAmount: total };
  }

  async setTotalAmount(workOrderId, amount) {
    const pool = await poolPromise;
    await pool.request()
      .input("WorkOrderID", sql.Int, workOrderId)
      .input("TotalAmount", sql.Decimal(18,2), amount)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE WorkOrder SET TotalAmount = @TotalAmount, UpdatedAt = @updatedAt WHERE WorkOrderID = @WorkOrderID
      `);
  }
}

module.exports = new WorkOrderRepository();
