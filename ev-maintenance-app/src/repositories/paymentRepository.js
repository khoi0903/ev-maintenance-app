// src/repositories/paymentRepository.js
// Lưu giao dịch thanh toán (PaymentTransaction)
const { poolPromise, sql } = require("../db");

class PaymentRepository {
  // Tạo giao dịch (Pending)
  async createPayment({ InvoiceID, Amount, Method, Status = "Pending" }) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("InvoiceID", sql.Int, InvoiceID)
      .input("Amount", sql.Decimal(18,2), Amount)
      .input("Method", sql.NVarChar(50), Method)
      .input("Status", sql.NVarChar(20), Status)
      .query(`
        INSERT INTO PaymentTransaction (InvoiceID, Amount, Method, Status, PaymentDate, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@InvoiceID, @Amount, @Method, @Status, SYSUTCDATETIME(), SYSUTCDATETIME())
      `);
    return r.recordset[0];
  }

  // Lấy các giao dịch theo Invoice
  async getByInvoiceId(invoiceId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("InvoiceID", sql.Int, invoiceId)
      .query("SELECT * FROM PaymentTransaction WHERE InvoiceID = @InvoiceID ORDER BY CreatedDate DESC");
    return r.recordset;
  }

  // Đánh dấu transaction thành success (vd sau callback)
  async markSuccess(transactionId) {
    const pool = await poolPromise;
    await pool.request()
      .input("TransactionID", sql.Int, transactionId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE PaymentTransaction SET Status = 'Success', UpdatedAt = @updatedAt WHERE TransactionID = @TransactionID
      `);
  }

  // Update status theo Invoice (nếu cần)
  async updateStatusByInvoice(invoiceId, status) {
    const pool = await poolPromise;
    await pool.request()
      .input("InvoiceID", sql.Int, invoiceId)
      .input("Status", sql.NVarChar(20), status)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE PaymentTransaction SET Status = @Status, UpdatedAt = @updatedAt WHERE InvoiceID = @InvoiceID
      `);
  }
}

module.exports = new PaymentRepository();
