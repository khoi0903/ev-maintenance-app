const { poolPromise, sql } = require('../db');

class EventRepository {
  /**
   * Lấy danh sách events từ các bảng:
   * - Appointment (tất cả status)
   * - PaymentTransaction (Success)
   * - WorkOrder (Completed)
   * - Account (new users)
   */
  async getRecent(limit = 20) {
    try {
      const pool = await poolPromise;
      const req = pool.request();
      req.input('Limit', sql.Int, limit);

      const rs = await req.query(`
      SELECT TOP (@Limit) *
      FROM (
        SELECT 
          'appointment' AS EventType,
          CAST(a.AppointmentID AS NVARCHAR(50)) AS EventID,
          CASE 
            WHEN a.Status = 'Pending' THEN 'New Appointment Created'
            WHEN a.Status = 'Confirmed' THEN 'Appointment Confirmed'
            WHEN a.Status = 'Completed' THEN 'Appointment Completed'
            WHEN a.Status = 'Cancelled' THEN 'Appointment Cancelled'
            ELSE 'Appointment Updated'
          END AS Title,
          CASE 
            WHEN a.Status = 'Pending' THEN CONCAT('Appointment #', a.AppointmentID, ' was created')
            WHEN a.Status = 'Confirmed' THEN CONCAT('Appointment #', a.AppointmentID, ' was confirmed')
            WHEN a.Status = 'Completed' THEN CONCAT('Appointment #', a.AppointmentID, ' was completed')
            WHEN a.Status = 'Cancelled' THEN CONCAT('Appointment #', a.AppointmentID, ' was cancelled')
            ELSE CONCAT('Appointment #', a.AppointmentID, ' was updated')
          END AS Description,
          acc.FullName AS UserName,
          a.CreatedAt AS Timestamp
        FROM Appointment a
        JOIN Account acc ON acc.AccountID = a.AccountID
        WHERE a.CreatedAt >= DATEADD(day, -7, SYSUTCDATETIME())
        
        UNION ALL
        
        SELECT 
          'payment' AS EventType,
          CAST(pt.TransactionID AS NVARCHAR(50)) AS EventID,
          'Payment Processed' AS Title,
          CONCAT('Payment of ', FORMAT(pt.Amount, 'N0'), ' VND was successfully processed') AS Description,
          acc.FullName AS UserName,
          pt.CreatedAt AS Timestamp
        FROM PaymentTransaction pt
        JOIN Invoice i ON i.InvoiceID = pt.InvoiceID
        LEFT JOIN Appointment a ON a.AppointmentID = i.AppointmentID
        LEFT JOIN Account acc ON acc.AccountID = a.AccountID
        WHERE pt.Status = 'Success'
          AND pt.CreatedAt >= DATEADD(day, -7, SYSUTCDATETIME())
        
        UNION ALL
        
        SELECT 
          'workorder' AS EventType,
          CAST(wo.WorkOrderID AS NVARCHAR(50)) AS EventID,
          'Work Order Completed' AS Title,
          CONCAT('Work Order #', wo.WorkOrderID, ' was completed') AS Description,
          acc.FullName AS UserName,
          wo.UpdatedAt AS Timestamp
        FROM WorkOrder wo
        JOIN Appointment a ON a.AppointmentID = wo.AppointmentID
        JOIN Account acc ON acc.AccountID = a.AccountID
        WHERE wo.ProgressStatus = 'Completed'
          AND wo.UpdatedAt >= DATEADD(day, -7, SYSUTCDATETIME())
        
        UNION ALL
        
        SELECT 
          'user' AS EventType,
          CAST(acc.AccountID AS NVARCHAR(50)) AS EventID,
          'New User Registration' AS Title,
          CONCAT('User ', acc.FullName, ' registered in the system') AS Description,
          acc.FullName AS UserName,
          acc.CreatedAt AS Timestamp
        FROM Account acc
        WHERE acc.CreatedAt >= DATEADD(day, -7, SYSUTCDATETIME())
          AND acc.Role = 'Customer'
      ) AS Combined
      ORDER BY Timestamp DESC
    `);

      return rs.recordset.map(row => ({
        id: row.EventID,
        title: row.Title,
        description: row.Description,
        type: this.mapEventType(row.EventType),
        timestamp: this.formatTimestamp(row.Timestamp),
        user: row.UserName || null,
      }));
    } catch (error) {
      console.error('[EventRepository.getRecent] SQL error:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  mapEventType(sourceType) {
    const map = {
      'appointment': 'order',
      'payment': 'payment',
      'workorder': 'other',
      'user': 'user',
    };
    return map[sourceType] || 'other';
  }

  formatTimestamp(date) {
    if (!date) return 'Unknown';
    const now = new Date();
    const ts = new Date(date);
    const diffMs = now - ts;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

module.exports = new EventRepository();

