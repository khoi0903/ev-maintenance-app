const appointmentRepository = require("../repositories/appointmentRepository");

class AppointmentService {
  async createAppointment(accountId, { vehicleId, slotId, scheduledDate, notes }) {
    // Kiểm tra slot còn trống
    const count = await appointmentRepository.countActiveBySlot(slotId);
    if (count >= 5) throw new Error("Slot is full"); // giả sử 1 slot max 5

    return await appointmentRepository.createAppointment({
      accountId,
      vehicleId,
      slotId,
      scheduledDate,
      notes,
    });
  }

  async getAppointmentsByAccount(accountId) {
    return await appointmentRepository.getAppointmentsByAccount(accountId);
  }

  async confirmAppointment(appointmentId, staffId, technicianId = null) {
    return await appointmentRepository.confirmAppointment(
      appointmentId,
      staffId,
      technicianId
    );
  }

  async cancelAppointment(id) {
    return await appointmentRepository.cancelAppointment(id);
  }
}

module.exports = new AppointmentService();
