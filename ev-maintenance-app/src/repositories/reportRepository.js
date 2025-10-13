// src/repositories/reportRepository.js
// Repository chuyên cho thống kê và báo cáo
const { poolPromise, sql } = require("../db");

class ReportRepository {
  // Báo cáo doanh thu theo ngày
  async getRevenueByDateRange(startDate, endDate) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("StartDate", sql.DateTime2, startDate)
      .input("EndDate", sql.DateTime2, endDate)
      .query(`
        SELECT 
          CONVERT(date, PaymentDate) AS ReportDate,
          SUM(Amount) AS TotalRevenue,
          COUNT(*) AS TransactionCount
        FROM PaymentTransaction
        WHERE Status = 'Success'
          AND PaymentDate BETWEEN @StartDate AND @EndDate
        GROUP BY CONVERT(date, PaymentDate)
        ORDER BY ReportDate ASC
      `);
    return r.recordset;
  }

  // Báo cáo doanh thu theo kỹ thuật viên
  async getRevenueByTechnician(startDate, endDate) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("StartDate", sql.DateTime2, startDate)
      .input("EndDate", sql.DateTime2, endDate)
      .query(`
        SELECT 
          t.FullName AS TechnicianName,
          SUM(i.TotalAmount) AS TotalRevenue,
          COUNT(i.InvoiceID) AS InvoiceCount
        FROM Invoice i
        JOIN WorkOrder w ON i.WorkOrderID = w.WorkOrderID
        JOIN Account t ON w.TechnicianID = t.AccountID
        WHERE i.PaymentStatus = 'Paid'
          AND i.CreatedAt BETWEEN @StartDate AND @EndDate
        GROUP BY t.FullName
        ORDER BY TotalRevenue DESC
      `);
    return r.recordset;
  }

  // Báo cáo tổng số lượng (appointments, invoices, revenue)
  async getSystemSummary() {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Appointment) AS TotalAppointments,
        (SELECT COUNT(*) FROM WorkOrder) AS TotalWorkOrders,
        (SELECT COUNT(*) FROM Invoice) AS TotalInvoices,
        (SELECT ISNULL(SUM(TotalAmount),0) FROM Invoice WHERE PaymentStatus='Paid') AS TotalRevenue
    `);
    return r.recordset[0];
  }
}

module.exports = new ReportRepository();
