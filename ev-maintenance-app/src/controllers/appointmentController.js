const appointmentRepository = require("../repositories/appointmentRepository");

class AppointmentController {
  async createAppointment(req, res) {
    try {
      const accountId = req.user.accountId;
      const { vehicleId, slotId, technicianId, notes } = req.body;

      const appointment = await appointmentRepository.createAppointment({
        accountId,
        vehicleId,
        slotId,
        technicianId: technicianId || null,
        notes: notes || null,
      });

      res.status(201).json(appointment);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getMyAppointments(req, res) {
    try {
      const accountId = req.user.accountId;
      const appointments = await appointmentRepository.getAppointmentsByAccount(accountId);
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async confirmAppointment(req, res) {
    try {
      const staffId = req.user.accountId;
      await appointmentRepository.confirmAppointment(req.params.id, staffId);
      res.json({ message: "Appointment confirmed by staff" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async cancelAppointment(req, res) {
    try {
      await appointmentRepository.cancelAppointment(req.params.id);
      res.json({ message: "Appointment cancelled" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new AppointmentController();
