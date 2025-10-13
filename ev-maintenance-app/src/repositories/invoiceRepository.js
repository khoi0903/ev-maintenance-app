// src/repositories/invoiceRepository.js
// Quản lý Invoice
const { poolPromise, sql } = require("../db");

class InvoiceRepository {
  // Tạo invoice (có thể là từ appointment hoặc workorder)
  async create({ AppointmentID = null, WorkOrderID = null, TotalAmount }) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AppointmentID", sql.Int, AppointmentID)
      .input("WorkOrderID", sql.Int, WorkOrderID)
      .input("TotalAmount", sql.Decimal(18,2), TotalAmount)
      .query(`
        INSERT INTO Invoice (AppointmentID, WorkOrderID, TotalAmount, PaymentStatus, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@AppointmentID, @WorkOrderID, @TotalAmount, 'Unpaid', SYSUTCDATETIME())
      `);
    return r.recordset[0];
  }

  async getById(id) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("InvoiceID", sql.Int, id)
      .query("SELECT * FROM Invoice WHERE InvoiceID = @InvoiceID");
    return r.recordset[0];
  }

  async getAllPaid() {
    const pool = await poolPromise;
    const r = await pool.request().query("SELECT * FROM Invoice WHERE PaymentStatus = 'Paid' ORDER BY CreatedAt DESC");
    return r.recordset;
  }

  async markPaid(invoiceId) {
    const pool = await poolPromise;
    await pool.request()
      .input("InvoiceID", sql.Int, invoiceId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Invoice SET PaymentStatus = 'Paid', UpdatedAt = @updatedAt WHERE InvoiceID = @InvoiceID
      `);
  }
}

module.exports = new InvoiceRepository();
