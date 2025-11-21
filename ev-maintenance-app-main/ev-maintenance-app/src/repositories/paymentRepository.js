const { poolPromise, sql } = require('../db');

class PaymentRepository {
  async getById(txnId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('TransactionID', sql.Int, txnId)
      .query('SELECT * FROM PaymentTransaction WHERE TransactionID=@TransactionID');
    return rs.recordset[0] || null;
  }

  async findPendingByInvoiceAndMethod(invoiceId, method) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .input('Method', sql.NVarChar(50), method)
      .query(`
        SELECT TOP 1 *
        FROM PaymentTransaction
        WHERE InvoiceID=@InvoiceID AND Method=@Method AND Status='Pending'
        ORDER BY TransactionID DESC
      `);
    return rs.recordset[0] || null;
  }

  // Dùng OUTPUT INTO để tránh lỗi trigger
  async create({ invoiceId, amount, method, status='Pending', bankCode=null, gatewayMeta=null, checkoutUrl=null }) {
    const pool = await poolPromise;
    const req = pool.request();
    req.input('InvoiceID', sql.Int, invoiceId);
    req.input('Amount', sql.Decimal(18,2), amount);
    req.input('Method', sql.NVarChar(50), method);
    req.input('Status', sql.NVarChar(20), status);
    req.input('GatewayBankCode', sql.NVarChar(20), bankCode);
    req.input('GatewayMeta', sql.NVarChar(sql.MAX), gatewayMeta);
    req.input('CheckoutUrl', sql.NVarChar(1000), checkoutUrl);

    const q = `
      DECLARE @New TABLE(TransactionID INT);
      INSERT INTO PaymentTransaction (InvoiceID, Amount, Method, Status, GatewayBankCode, GatewayMeta, CheckoutUrl, CreatedAt)
      OUTPUT INSERTED.TransactionID INTO @New
      VALUES (@InvoiceID, @Amount, @Method, @Status, @GatewayBankCode, @GatewayMeta, @CheckoutUrl, SYSUTCDATETIME());

      SELECT * FROM PaymentTransaction WHERE TransactionID=(SELECT TOP 1 TransactionID FROM @New);
    `;
    const r = await req.query(q);
    return r.recordset[0];
  }

  async updateStatus(txnId, status) {
    const pool = await poolPromise;
    await pool.request()
      .input('TransactionID', sql.Int, txnId)
      .input('Status', sql.NVarChar(20), status)
      .query('UPDATE PaymentTransaction SET Status=@Status, UpdatedAt=SYSUTCDATETIME() WHERE TransactionID=@TransactionID');
  }

  async saveGatewayMeta(txnId, metaStr) {
    const pool = await poolPromise;
    await pool.request()
      .input('TransactionID', sql.Int, txnId)
      .input('GatewayMeta', sql.NVarChar(sql.MAX), metaStr)
      .query('UPDATE PaymentTransaction SET GatewayMeta=@GatewayMeta, UpdatedAt=SYSUTCDATETIME() WHERE TransactionID=@TransactionID');
  }

  async saveCheckoutUrl(txnId, checkoutUrl) {
    const pool = await poolPromise;
    await pool.request()
      .input('TransactionID', sql.Int, txnId)
      .input('CheckoutUrl', sql.NVarChar(1000), checkoutUrl)
      .query('UPDATE PaymentTransaction SET CheckoutUrl=@CheckoutUrl, UpdatedAt=SYSUTCDATETIME() WHERE TransactionID=@TransactionID');
  }

  async getLatestPendingForAppointment(appointmentId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('AppointmentID', sql.Int, appointmentId)
      .query(`
        SELECT TOP 1 pt.*
        FROM PaymentTransaction pt
        JOIN Invoice i ON i.InvoiceID = pt.InvoiceID
        WHERE i.AppointmentID=@AppointmentID AND pt.Status='Pending'
        ORDER BY pt.TransactionID DESC
      `);
    return rs.recordset[0] || null;
  }

  async listAll({ accountId, invoiceId, status } = {}) {
    const pool = await poolPromise;
    const req = pool.request();
    const conds = [];
    if (invoiceId) {
      req.input('InvoiceID', sql.Int, invoiceId);
      conds.push('pt.InvoiceID = @InvoiceID');
    }
    if (status) {
      req.input('Status', sql.NVarChar(20), status);
      conds.push('pt.Status = @Status');
    }
    if (accountId) {
      req.input('AccountID', sql.Int, accountId);
      conds.push('a.AccountID = @AccountID');
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rs = await req.query(`
      SELECT
        pt.TransactionID,
        pt.InvoiceID,
        pt.Amount,
        pt.Method,
        pt.Status,
        pt.PaymentDate,
        pt.CreatedAt,
        pt.UpdatedAt,
        pt.GatewayBankCode,
        pt.GatewayRspCode,
        pt.GatewayTxnNo,
        pt.GatewayPayDate,
        pt.CheckoutUrl,
        i.AppointmentID,
        i.WorkOrderID,
        a.AccountID,
        acc.FullName AS CustomerName,
        acc.Phone     AS CustomerPhone
      FROM PaymentTransaction pt
      LEFT JOIN Invoice i ON i.InvoiceID = pt.InvoiceID
      LEFT JOIN Appointment a ON a.AppointmentID = i.AppointmentID
      LEFT JOIN Account acc ON acc.AccountID = a.AccountID
      ${where}
      ORDER BY pt.CreatedAt DESC
    `);
    return rs.recordset;
  }
}

module.exports = new PaymentRepository();
