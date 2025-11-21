const { poolPromise, sql } = require('../db');

class NotificationRepository {
  /**
   * Lấy danh sách notifications từ các bảng:
   * - Appointment (Pending/Confirmed)
   * - PaymentTransaction (Pending)
   * - WorkOrder (Pending/InProgress)
   */
  async getAll(limit = 20, userId = null) {
    try {
      const pool = await poolPromise;
      const req = pool.request();
      req.input('Limit', sql.Int, limit);

      const rs = await req.query(`
      SELECT TOP (@Limit) *
      FROM (
        SELECT 
          'appointment' AS SourceType,
          CAST(a.AppointmentID AS NVARCHAR(50)) AS NotificationID,
          CASE 
            WHEN a.Status = 'Pending' THEN 'New Appointment Request'
            WHEN a.Status = 'Confirmed' THEN 'Appointment Confirmed'
            ELSE 'Appointment Update'
          END AS Title,
          CASE 
            WHEN a.Status = 'Pending' THEN CONCAT('Appointment #', a.AppointmentID, ' is pending confirmation')
            WHEN a.Status = 'Confirmed' THEN CONCAT('Appointment #', a.AppointmentID, ' has been confirmed')
            ELSE CONCAT('Appointment #', a.AppointmentID, ' status updated')
          END AS Message,
          CASE 
            WHEN a.Status = 'Pending' THEN 'warning'
            WHEN a.Status = 'Confirmed' THEN 'success'
            ELSE 'info'
          END AS Type,
          a.CreatedAt AS Timestamp,
          0 AS IsRead
        FROM Appointment a
        WHERE a.Status IN ('Pending', 'Confirmed')
          AND a.CreatedAt >= DATEADD(day, -7, SYSUTCDATETIME())
        
        UNION ALL
        
        SELECT 
          'payment' AS SourceType,
          CAST(pt.TransactionID AS NVARCHAR(50)) AS NotificationID,
          CASE 
            WHEN pt.Status = 'Pending' THEN 'Payment Pending'
            WHEN pt.Status = 'Success' THEN 'Payment Received'
            WHEN pt.Status = 'Failed' THEN 'Payment Failed'
            ELSE 'Payment Update'
          END AS Title,
          CASE 
            WHEN pt.Status = 'Pending' THEN CONCAT('Payment transaction #', pt.TransactionID, ' is pending')
            WHEN pt.Status = 'Success' THEN CONCAT('Payment of ', FORMAT(pt.Amount, 'N0'), ' VND received')
            WHEN pt.Status = 'Failed' THEN CONCAT('Payment transaction #', pt.TransactionID, ' failed')
            ELSE CONCAT('Payment transaction #', pt.TransactionID, ' updated')
          END AS Message,
          CASE 
            WHEN pt.Status = 'Pending' THEN 'warning'
            WHEN pt.Status = 'Success' THEN 'success'
            WHEN pt.Status = 'Failed' THEN 'error'
            ELSE 'info'
          END AS Type,
          pt.CreatedAt AS Timestamp,
          0 AS IsRead
        FROM PaymentTransaction pt
        WHERE pt.Status IN ('Pending', 'Success', 'Failed')
          AND pt.CreatedAt >= DATEADD(day, -7, SYSUTCDATETIME())
        
        UNION ALL
        
        SELECT 
          'workorder' AS SourceType,
          CAST(wo.WorkOrderID AS NVARCHAR(50)) AS NotificationID,
          CASE 
            WHEN wo.ProgressStatus = 'Pending' THEN 'New Work Order'
            WHEN wo.ProgressStatus = 'InProgress' THEN 'Work Order In Progress'
            WHEN wo.ProgressStatus = 'Completed' THEN 'Work Order Completed'
            ELSE 'Work Order Update'
          END AS Title,
          CASE 
            WHEN wo.ProgressStatus = 'Pending' THEN CONCAT('Work Order #', wo.WorkOrderID, ' is pending')
            WHEN wo.ProgressStatus = 'InProgress' THEN CONCAT('Work Order #', wo.WorkOrderID, ' is in progress')
            WHEN wo.ProgressStatus = 'Completed' THEN CONCAT('Work Order #', wo.WorkOrderID, ' has been completed')
            ELSE CONCAT('Work Order #', wo.WorkOrderID, ' status updated')
          END AS Message,
          CASE 
            WHEN wo.ProgressStatus = 'Pending' THEN 'warning'
            WHEN wo.ProgressStatus = 'InProgress' THEN 'info'
            WHEN wo.ProgressStatus = 'Completed' THEN 'success'
            ELSE 'info'
          END AS Type,
          wo.CreatedAt AS Timestamp,
          0 AS IsRead
        FROM WorkOrder wo
        WHERE wo.ProgressStatus IN ('Pending', 'InProgress', 'Completed')
          AND wo.CreatedAt >= DATEADD(day, -7, SYSUTCDATETIME())
      ) AS Combined
      ORDER BY Timestamp DESC
    `);

      // If userId provided, retrieve read markers and merge
      let readSet = new Set()
      if (userId != null) {
        try {
          // First check if NotificationReads table exists to avoid SQL errors
          const tblCheck = await pool.request().query(`
            SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'NotificationReads'
          `);

          if (tblCheck && Array.isArray(tblCheck.recordset) && tblCheck.recordset.length > 0) {
            const readRes = await pool.request()
              .input('UserID', sql.Int, userId)
              .query(`SELECT NotificationID FROM NotificationReads WHERE UserID = @UserID`);

            const readRows = readRes.recordset || [];
            readRows.forEach((rw) => readSet.add(String(rw.NotificationID)));
          } else {
            // table doesn't exist yet - nothing to mark as read
          }
        } catch (e) {
          // ignore errors reading read markers but log for debugging
          console.error('[NotificationRepository.getAll] failed to load read markers', e)
        }
      }

      return rs.recordset.map(row => ({
        id: row.NotificationID,
        title: row.Title,
        message: row.Message,
        type: row.Type,
        timestamp: this.formatTimestamp(row.Timestamp),
        read: userId != null ? readSet.has(String(row.NotificationID)) : (row.IsRead === 1),
      }));
    } catch (error) {
      console.error('[NotificationRepository.getAll] SQL error:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  async markAsRead(userId, notificationId) {
    try {
      const pool = await poolPromise;
      const req = pool.request();
      req.input('UserID', sql.Int, userId);
      req.input('NotificationID', sql.NVarChar(50), String(notificationId));

      // Ensure table exists (safe to run repeatedly)
      await req.query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificationReads')
        BEGIN
          CREATE TABLE NotificationReads (
            UserID INT NOT NULL,
            NotificationID NVARCHAR(50) NOT NULL,
            ReadAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_NotificationReads PRIMARY KEY (UserID, NotificationID)
          )
        END
      `);

      // Insert or update read timestamp
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('NotificationID', sql.NVarChar(50), String(notificationId))
        .query(`
          IF EXISTS (SELECT 1 FROM NotificationReads WHERE UserID = @UserID AND NotificationID = @NotificationID)
            UPDATE NotificationReads SET ReadAt = SYSUTCDATETIME() WHERE UserID = @UserID AND NotificationID = @NotificationID
          ELSE
            INSERT INTO NotificationReads (UserID, NotificationID, ReadAt) VALUES (@UserID, @NotificationID, SYSUTCDATETIME())
        `)

      return true
    } catch (err) {
      console.error('[NotificationRepository.markAsRead] error:', err)
      return false
    }
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

module.exports = new NotificationRepository();

