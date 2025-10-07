const appointmentService = require("../services/appointmentService");

class AppointmentController {
  async createAppointment(req, res) {
    try {
      const result = await appointmentService.createAppointment(req.user.accountId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAppointments(req, res) {
    try {
      const appointments = await appointmentService.getAppointmentsByAccount(req.user.accountId);
      res.json(appointments);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async confirmAppointment(req, res) {
    try {
      const { appointmentId } = req.params;
      const { technicianId } = req.body;
      const result = await appointmentService.confirmAppointment(
        appointmentId,
        req.user.accountId, // staff xác nhận
        technicianId
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async cancelAppointment(req, res) {
    try {
      const { appointmentId } = req.params;
      const result = await appointmentService.cancelAppointment(appointmentId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new AppointmentController();
