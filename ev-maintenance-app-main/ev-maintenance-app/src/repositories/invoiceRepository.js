const { poolPromise, sql } = require('../db');

class InvoiceRepository {
  async getById(id) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('InvoiceID', sql.Int, id)
      .query('SELECT * FROM Invoice WHERE InvoiceID=@InvoiceID');
    return rs.recordset[0] || null;
  }

  async getByIdWithAccount(id) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('InvoiceID', sql.Int, id)
      .query(`
        SELECT 
          i.*,
          a.AccountID
        FROM Invoice i
        LEFT JOIN Appointment a ON a.AppointmentID = i.AppointmentID
        WHERE i.InvoiceID = @InvoiceID
      `);
    return rs.recordset[0] || null;
  }

  async getByAppointment(appointmentId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('AppointmentID', sql.Int, appointmentId)
      .query('SELECT TOP 1 * FROM Invoice WHERE AppointmentID=@AppointmentID ORDER BY InvoiceID DESC');
    return rs.recordset[0] || null;
  }

  // Tạo invoice (dùng OUTPUT INTO để tránh lỗi trigger)
  async createForAppointment({ appointmentId, totalAmount }) {
    const pool = await poolPromise;
    const req = pool.request();
    req.input('AppointmentID', sql.Int, appointmentId);
    req.input('TotalAmount', sql.Decimal(18,2), totalAmount);

    const q = `
      DECLARE @New TABLE(InvoiceID INT);
      INSERT INTO Invoice (AppointmentID, WorkOrderID, TotalAmount, PaymentStatus, SentToCustomerAt, SentByStaffID, CreatedAt)
      OUTPUT INSERTED.InvoiceID INTO @New
      VALUES (@AppointmentID, NULL, @TotalAmount, 'Unpaid', NULL, NULL, SYSUTCDATETIME());

      SELECT i.*
      FROM Invoice i
      JOIN @New n ON i.InvoiceID = n.InvoiceID;
    `;
    console.log('[InvoiceRepository.createForAppointment] Creating invoice for AppointmentID:', appointmentId, 'TotalAmount:', totalAmount);
    const r = await req.query(q);
    return r.recordset[0];
  }

  async updateAmount(invoiceId, totalAmount) {
    const pool = await poolPromise;
    await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .input('TotalAmount', sql.Decimal(18,2), totalAmount)
      .query('UPDATE Invoice SET TotalAmount=@TotalAmount, UpdatedAt=SYSUTCDATETIME() WHERE InvoiceID=@InvoiceID');
  }

  async updateWorkOrderId(invoiceId, workOrderId) {
    const pool = await poolPromise;
    await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .input('WorkOrderID', sql.Int, workOrderId)
      .query('UPDATE Invoice SET WorkOrderID=@WorkOrderID, UpdatedAt=SYSUTCDATETIME() WHERE InvoiceID=@InvoiceID');
  }

  async markPaid(invoiceId) {
    const pool = await poolPromise;
    await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .query(`UPDATE Invoice SET PaymentStatus='Paid', UpdatedAt=SYSUTCDATETIME() WHERE InvoiceID=@InvoiceID`);
  }

  async markUnpaid(invoiceId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .query(`
        UPDATE Invoice
        SET PaymentStatus='Unpaid',
            UpdatedAt=SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE InvoiceID=@InvoiceID
      `);
    return rs.recordset[0];
  }

  async listByAccount(accountId) {
    const pool = await poolPromise;
    const req = pool.request()
      .input('AccountID', sql.Int, accountId);

    const query = `
      SELECT 
        i.InvoiceID,
        i.AppointmentID,
        i.WorkOrderID AS InvoiceWorkOrderID,
        i.TotalAmount,
        i.PaymentStatus,
        i.CreatedAt,
        i.UpdatedAt,
        a.AccountID,
        a.Status AS AppointmentStatus,
        v.VIN,
        v.LicensePlate,
        COALESCE(wo.WorkOrderID, i.WorkOrderID) AS WorkOrderID_Detail,
        wo.ProgressStatus AS WorkOrderStatus,
        wo.TotalAmount AS WorkOrderTotalAmount,
        wo.EndTime AS WorkOrderCompletedAt,
        i.SentToCustomerAt,
        i.SentByStaffID,
        i.CustomerPaidAt
      FROM Invoice i
      LEFT JOIN Appointment a ON a.AppointmentID = i.AppointmentID
      LEFT JOIN Vehicle v ON v.VehicleID = a.VehicleID
      OUTER APPLY (
        SELECT TOP 1 
          wo2.WorkOrderID,
          wo2.ProgressStatus,
          wo2.TotalAmount,
          wo2.EndTime
        FROM WorkOrder wo2
        WHERE wo2.AppointmentID = a.AppointmentID
          OR (i.WorkOrderID IS NOT NULL AND wo2.WorkOrderID = i.WorkOrderID)
        ORDER BY 
          CASE wo2.ProgressStatus
            WHEN 'Done' THEN 1
            WHEN 'Completed' THEN 1
            WHEN 'InProgress' THEN 2
            WHEN 'Pending' THEN 3
            ELSE 4
          END,
          wo2.UpdatedAt DESC
      ) wo
      WHERE a.AccountID = @AccountID
      ORDER BY i.CreatedAt DESC
    `;

    const rs = await req.query(query);
    return rs.recordset;
  }

  async listAll({ status, accountId, completedOnly } = {}) {
    const pool = await poolPromise;
    const req = pool.request();
    const conds = [];
    if (status) {
      req.input('PaymentStatus', sql.NVarChar(20), status);
      conds.push('i.PaymentStatus = @PaymentStatus');
    }
    if (accountId) {
      req.input('AccountID', sql.Int, accountId);
      conds.push('a.AccountID = @AccountID');
    }
    if (completedOnly) {
      conds.push('(wo.ProgressStatus = \'Done\' OR wo.ProgressStatus = \'Completed\')');
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const query = `
      SELECT 
        i.InvoiceID,
        i.AppointmentID,
        i.WorkOrderID AS InvoiceWorkOrderID,
        i.TotalAmount,
        i.PaymentStatus,
        i.CreatedAt,
        i.UpdatedAt,
        a.AccountID,
        acc.FullName AS CustomerName,
        acc.Phone     AS CustomerPhone,
        acc.Email     AS CustomerEmail,
        v.VIN,
        v.LicensePlate,
        COALESCE(wo.WorkOrderID, i.WorkOrderID) AS WorkOrderID_Detail,
        wo.ProgressStatus AS WorkOrderStatus,
        wo.TotalAmount AS WorkOrderTotalAmount,
        wo.EndTime AS WorkOrderCompletedAt,
        i.SentToCustomerAt,
        i.SentByStaffID,
        i.CustomerPaidAt
      FROM Invoice i
      LEFT JOIN Appointment a ON a.AppointmentID = i.AppointmentID
      LEFT JOIN Account acc ON acc.AccountID = a.AccountID
      LEFT JOIN Vehicle v   ON v.VehicleID   = a.VehicleID
      OUTER APPLY (
        SELECT TOP 1 
          wo2.WorkOrderID,
          wo2.ProgressStatus,
          wo2.TotalAmount,
          wo2.EndTime
        FROM WorkOrder wo2
        WHERE wo2.AppointmentID = a.AppointmentID
          OR (i.WorkOrderID IS NOT NULL AND wo2.WorkOrderID = i.WorkOrderID)
        ORDER BY 
          CASE wo2.ProgressStatus
            WHEN 'Done' THEN 1
            WHEN 'Completed' THEN 1
            WHEN 'InProgress' THEN 2
            WHEN 'Pending' THEN 3
            ELSE 4
          END,
          wo2.UpdatedAt DESC
      ) wo
      ${where}
      ORDER BY i.CreatedAt DESC
    `;
    console.log('[InvoiceRepository.listAll] SQL Query:', query.replace(/\s+/g, ' ').trim());
    const rs = await req.query(query);
    console.log('[InvoiceRepository.listAll] Query returned', rs.recordset?.length || 0, 'rows');
    if (rs.recordset && rs.recordset.length > 0) {
      console.log('[InvoiceRepository.listAll] Sample row:', {
        InvoiceID: rs.recordset[0].InvoiceID,
        WorkOrderStatus: rs.recordset[0].WorkOrderStatus,
        TotalAmount: rs.recordset[0].TotalAmount,
      });
    }
    return rs.recordset;
  }

  async markSent(invoiceId, staffId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .input('SentAt', sql.DateTime2, new Date())
      .input('StaffID', sql.Int, staffId || null)
      .query(`
        UPDATE Invoice
        SET SentToCustomerAt = @SentAt,
            SentByStaffID = COALESCE(@StaffID, SentByStaffID),
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE InvoiceID = @InvoiceID
      `);
    return rs.recordset[0];
  }

  // 👉 KHÁCH "đã chuyển khoản": chỉ set CustomerPaidAt, KHÔNG đổi PaymentStatus
  async markCustomerPaid(invoiceId) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .input('PaidAt', sql.DateTime2, new Date())
      .query(`
        UPDATE Invoice
        SET CustomerPaidAt = @PaidAt,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE InvoiceID = @InvoiceID
      `);
    return rs.recordset[0];
  }
}

module.exports = new InvoiceRepository();
