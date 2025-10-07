const { sql, poolPromise } = require("../db");

class AppointmentRepository {
  async createAppointment({ accountId, vehicleId, slotId, scheduledDate, notes }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("accountId", sql.Int, accountId)
      .input("vehicleId", sql.Int, vehicleId)
      .input("slotId", sql.Int, slotId)
      .input("scheduledDate", sql.DateTime2, scheduledDate)
      .input("notes", sql.NVarChar, notes || null)
      .query(`
        INSERT INTO Appointment (AccountID, VehicleID, SlotID, ScheduledDate, Status, Notes)
        OUTPUT INSERTED.*
        VALUES (@accountId, @vehicleId, @slotId, @scheduledDate, 'Pending', @notes)
      `);
    return result.recordset[0];
  }

  async getAppointmentById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`SELECT * FROM Appointment WHERE AppointmentID = @id`);
    return result.recordset[0];
  }

  async getAppointmentsByAccount(accountId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("accountId", sql.Int, accountId)
      .query(`
        SELECT a.*, v.LicensePlate, v.VIN, s.StartTime, s.EndTime
        FROM Appointment a
        JOIN Vehicle v ON a.VehicleID = v.VehicleID
        JOIN Slot s ON a.SlotID = s.SlotID
        WHERE a.AccountID = @accountId
        ORDER BY a.CreatedAt DESC
      `);
    return result.recordset;
  }

  async confirmAppointment(appointmentId, staffId, technicianId = null) {
    const pool = await poolPromise;
    const req = pool.request()
      .input("appointmentId", sql.Int, appointmentId)
      .input("staffId", sql.Int, staffId)
      .input("updatedAt", sql.DateTime2, new Date());

    if (technicianId) req.input("technicianId", sql.Int, technicianId);

    const q = `
      UPDATE Appointment
      SET Status = 'Confirmed',
          ConfirmedByStaffID = @staffId,
          ${ technicianId ? "TechnicianID = @technicianId," : "" }
          UpdatedAt = @updatedAt
      WHERE AppointmentID = @appointmentId
      OUTPUT INSERTED.*;
    `;

    const result = await req.query(q);
    return result.recordset[0];
  }

  async cancelAppointment(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Appointment
        SET Status = 'Cancelled',
            UpdatedAt = @updatedAt
        WHERE AppointmentID = @id
        OUTPUT INSERTED.*;
      `);
    return result.recordset[0];
  }

  // count non-cancelled appointments in slot
  async countActiveBySlot(slotId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("slotId", sql.Int, slotId)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM Appointment
        WHERE SlotID = @slotId AND Status <> 'Cancelled'
      `);
    return result.recordset[0]?.cnt || 0;
  }

  // record preferred technician (optional)
  async addPreferredTechnician(appointmentId, technicianId) {
    const pool = await poolPromise;
    await pool.request()
      .input("appointmentId", sql.Int, appointmentId)
      .input("technicianId", sql.Int, technicianId)
      .query(`
        INSERT INTO AppointmentTechnician (AppointmentID, TechnicianID)
        VALUES (@appointmentId, @technicianId)
      `);
  }
}

module.exports = new AppointmentRepository();
