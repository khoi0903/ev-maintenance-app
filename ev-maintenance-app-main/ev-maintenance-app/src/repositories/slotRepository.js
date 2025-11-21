// repositories/slotRepository.js
const { poolPromise, sql } = require("../db");

class SlotRepository {
  // Lấy slot còn chỗ theo ngày (UTC date hoặc local chuyển sang DATE)
  async getFreeByDate(dateStr) {
    const pool = await poolPromise;
    const req = pool.request();
    req.input("DateOnly", sql.Date, dateStr);

    const q = `
      ;WITH Used AS (
        SELECT SlotID, COUNT(*) AS Used
        FROM Appointment
        WHERE Status <> 'Cancelled'
        GROUP BY SlotID
      )
      SELECT 
        s.SlotID, s.StaffID, s.StartTime, s.EndTime, s.Capacity, s.Status,
        ISNULL(u.Used, 0) AS Used,
        (s.Capacity - ISNULL(u.Used,0)) AS Available
      FROM Slot s
      LEFT JOIN Used u ON u.SlotID = s.SlotID
      WHERE CAST(s.StartTime AS DATE) = @DateOnly
        AND (s.Capacity - ISNULL(u.Used,0)) > 0
      ORDER BY s.StartTime ASC;
    `;
    const r = await req.query(q);
    return r.recordset;
  }

  async getById(slotId) {
    const pool = await poolPromise;
    const req = pool.request();
    req.input("SlotID", sql.Int, slotId);
    const r = await req.query(`
      SELECT TOP 1 *
      FROM Slot
      WHERE SlotID = @SlotID;
    `);
    return r.recordset[0] || null;
  }

  async listAll({ date, status } = {}) {
    const pool = await poolPromise;
    const req = pool.request();
    const conds = [];
    
    if (date) {
      req.input("DateOnly", sql.Date, date);
      conds.push("CAST(StartTime AS DATE) = @DateOnly");
    }
    if (status) {
      req.input("Status", sql.NVarChar(20), status);
      conds.push("Status = @Status");
    }
    
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    
    const q = `
      ;WITH Used AS (
        SELECT SlotID, COUNT(*) AS Used
        FROM Appointment
        WHERE Status <> 'Cancelled'
        GROUP BY SlotID
      )
      SELECT 
        s.SlotID, 
        s.StaffID,
        acc.FullName AS StaffName,
        s.StartTime, 
        s.EndTime, 
        s.Capacity, 
        s.Status,
        ISNULL(u.Used, 0) AS Used,
        (s.Capacity - ISNULL(u.Used,0)) AS Available,
        s.CreatedAt,
        s.UpdatedAt
      FROM Slot s
      LEFT JOIN Account acc ON acc.AccountID = s.StaffID
      LEFT JOIN Used u ON u.SlotID = s.SlotID
      ${where}
      ORDER BY s.StartTime DESC;
    `;
    const r = await req.query(q);
    return r.recordset;
  }

  async create({ staffId, startTime, endTime, capacity = 4, status = 'Free' }) {
    const pool = await poolPromise;
    const req = pool.request();
    req.input("StaffID", sql.Int, staffId);
    req.input("StartTime", sql.DateTime2, startTime);
    req.input("EndTime", sql.DateTime2, endTime);
    req.input("Capacity", sql.Int, capacity);
    req.input("Status", sql.NVarChar(20), status);
    
    const q = `
      INSERT INTO Slot(StaffID, StartTime, EndTime, Capacity, Status, CreatedAt)
      OUTPUT INSERTED.*
      VALUES(@StaffID, @StartTime, @EndTime, @Capacity, @Status, SYSUTCDATETIME());
    `;
    const r = await req.query(q);
    return r.recordset[0];
  }

  async update(slotId, { startTime, endTime, capacity, status }) {
    const pool = await poolPromise;
    const req = pool.request();
    req.input("SlotID", sql.Int, slotId);
    const updates = [];
    
    if (startTime !== undefined) {
      req.input("StartTime", sql.DateTime2, startTime);
      updates.push("StartTime = @StartTime");
    }
    if (endTime !== undefined) {
      req.input("EndTime", sql.DateTime2, endTime);
      updates.push("EndTime = @EndTime");
    }
    if (capacity !== undefined) {
      req.input("Capacity", sql.Int, capacity);
      updates.push("Capacity = @Capacity");
    }
    if (status !== undefined) {
      req.input("Status", sql.NVarChar(20), status);
      updates.push("Status = @Status");
    }
    
    if (updates.length === 0) {
      return await this.getById(slotId);
    }
    
    updates.push("UpdatedAt = SYSUTCDATETIME()");
    const q = `
      UPDATE Slot
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE SlotID = @SlotID;
    `;
    const r = await req.query(q);
    return r.recordset[0] || null;
  }

  async delete(slotId) {
    const pool = await poolPromise;
    const req = pool.request();
    req.input("SlotID", sql.Int, slotId);
    
    // Kiểm tra xem slot có đang được sử dụng không
    const checkReq = pool.request();
    checkReq.input("SlotID", sql.Int, slotId);
    const checkRs = await checkReq.query(`
      SELECT COUNT(*) AS Count
      FROM Appointment
      WHERE SlotID = @SlotID AND Status <> 'Cancelled'
    `);
    
    if (checkRs.recordset[0].Count > 0) {
      throw new Error('Không thể xóa slot đang được sử dụng bởi appointment');
    }
    
    await req.query(`
      DELETE FROM Slot
      WHERE SlotID = @SlotID;
    `);
    return true;
  }

  async ensureSlot(startTime, endTime) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input("StartTime", sql.DateTime2, startTime)
      .query("SELECT SlotID FROM Slot WHERE StartTime=@StartTime");
    if (rs.recordset[0]) return rs.recordset[0].SlotID;

    // Giả sử StaffID = 1 (staff trực mặc định)
    const staffId = 1;
    const cap = 4;
    const rs2 = await pool.request()
      .input("StaffID", sql.Int, staffId)
      .input("StartTime", sql.DateTime2, startTime)
      .input("EndTime", sql.DateTime2, endTime)
      .input("Capacity", sql.Int, cap)
      .query(`
        INSERT INTO Slot(StaffID, StartTime, EndTime, Capacity, Status, CreatedAt)
        OUTPUT INSERTED.SlotID
        VALUES(@StaffID, @StartTime, @EndTime, @Capacity, 'Free', SYSUTCDATETIME())
      `);
    return rs2.recordset[0].SlotID;
  }
}

module.exports = new SlotRepository();
