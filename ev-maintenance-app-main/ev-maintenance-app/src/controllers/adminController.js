const { poolPromise } = require("../db");

exports.overview = async (_req, res) => {
  try {
    const pool = await poolPromise;
    const kpi = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Account WHERE Status='Active') AS ActiveUsers,
        (SELECT COUNT(*) FROM Vehicle) AS Vehicles,
        (SELECT COUNT(*) FROM Appointment WHERE Status='Pending') AS PendingAppointments,
        (SELECT COUNT(*) FROM WorkOrder WHERE Status <> 'Completed') AS ActiveWorkOrders,
        (SELECT COUNT(*) FROM Invoice WHERE PaymentStatus='Paid') AS PaidInvoices
    `);
    const monthly = await pool.request().query(`SELECT * FROM vw_MonthlyRevenue`);
    res.json({ success: true, data: { kpi: kpi.recordset[0], monthly: monthly.recordset } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listAccounts = async (_req, res) => {
  try {
    const pool = await poolPromise;
    const rs = await pool.request().query(`
      SELECT AccountID, Username, Role, FullName, Status, CreatedAt
      FROM Account ORDER BY CreatedAt DESC
    `);
    res.json({ success: true, data: rs.recordset });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listWorkOrders = async (_req, res) => {
  try {
    const pool = await poolPromise;
    const rs = await pool.request().query(`SELECT * FROM vw_WorkOrdersForTech ORDER BY WorkOrderID DESC`);
    res.json({ success: true, data: rs.recordset });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
