const pool = require("../db");

class AppointmentRepository {
  async createAppointment({ accountId, vehicleId, slotId, technicianId, notes }) {
    const result = await pool
      .request()
      .input("accountId", accountId)
      .input("vehicleId", vehicleId)
      .input("slotId", slotId)
      .input("technicianId", technicianId)
      .input("notes", notes)
      .query(`
        INSERT INTO Appointment (AccountID, VehicleID, SlotID, ScheduledDate, Status, TechnicianID, Notes)
        OUTPUT INSERTED.*
        VALUES (@accountId, @vehicleId, @slotId, SYSUTCDATETIME(), 'Pending', @technicianId, @notes)
      `);
    return result.recordset[0];
  }

  async getAppointmentsByAccount(accountId) {
    const result = await pool
      .request()
      .input("accountId", accountId)
      .query(`
        SELECT a.*, v.LicensePlate, v.VIN, s.StartTime, s.EndTime
        FROM Appointment a
        JOIN Vehicle v ON a.VehicleID = v.VehicleID
        JOIN Slot s ON a.SlotID = s.SlotID
        WHERE a.AccountID = @accountId
      `);
    return result.recordset;
  }

  async confirmAppointment(appointmentId, staffId) {
    await pool
      .request()
      .input("appointmentId", appointmentId)
      .input("staffId", staffId)
      .input("updatedAt", new Date())
      .query(`
        UPDATE Appointment
        SET Status = 'Confirmed',
            UpdatedAt = @updatedAt
        WHERE AppointmentID = @appointmentId
      `);
  }

  async cancelAppointment(appointmentId) {
    await pool
      .request()
      .input("appointmentId", appointmentId)
      .input("updatedAt", new Date())
      .query(`
        UPDATE Appointment
        SET Status = 'Cancelled',
            UpdatedAt = @updatedAt
        WHERE AppointmentID = @appointmentId
      `);
  }
}

module.exports = new AppointmentRepository();
