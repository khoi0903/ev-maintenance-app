// src/repositories/paymentRepository.js (patched)
const { poolPromise, sql } = require("../db");

class PaymentRepository {
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

  async getByInvoiceId(invoiceId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("InvoiceID", sql.Int, invoiceId)
      .query("SELECT * FROM PaymentTransaction WHERE InvoiceID = @InvoiceID ORDER BY CreatedAt DESC");
    return r.recordset;
  }

  async markSuccess(transactionId) {
    const pool = await poolPromise;
    await pool.request()
      .input("TransactionID", sql.Int, transactionId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE PaymentTransaction SET Status = 'Success', UpdatedAt = @updatedAt WHERE TransactionID = @TransactionID
      `);
  }

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
