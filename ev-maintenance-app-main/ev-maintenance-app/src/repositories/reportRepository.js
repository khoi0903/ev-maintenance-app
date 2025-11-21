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

  async getMonthlyWorkOrderTrend(year) {
    const pool = await poolPromise;
    const req = pool.request().input("Year", sql.Int, year);
    const query = `
      WITH Months AS (
        SELECT 1 AS MonthNumber
        UNION ALL
        SELECT MonthNumber + 1
        FROM Months
        WHERE MonthNumber < 12
      )
      SELECT
        m.MonthNumber AS Month,
        ISNULL(created.CountCreated, 0) AS CreatedCount,
        ISNULL(completed.CountCompleted, 0) AS CompletedCount
      FROM Months m
      LEFT JOIN (
        SELECT 
          MONTH(CreatedAt) AS MonthNumber,
          COUNT(*) AS CountCreated
        FROM WorkOrder
        WHERE YEAR(CreatedAt) = @Year
        GROUP BY MONTH(CreatedAt)
      ) created ON created.MonthNumber = m.MonthNumber
      LEFT JOIN (
        SELECT 
          MONTH(ISNULL(EndTime, UpdatedAt)) AS MonthNumber,
          COUNT(*) AS CountCompleted
        FROM WorkOrder
        WHERE (ProgressStatus = 'Done' OR ProgressStatus = 'Completed')
          AND YEAR(ISNULL(EndTime, UpdatedAt)) = @Year
        GROUP BY MONTH(ISNULL(EndTime, UpdatedAt))
      ) completed ON completed.MonthNumber = m.MonthNumber
      ORDER BY m.MonthNumber
      OPTION (MAXRECURSION 12);
    `;
    const rs = await req.query(query);
    return rs.recordset;
  }
}

module.exports = new ReportRepository();
