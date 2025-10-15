const appointmentRepository = require("../repositories/appointmentRepository");

class AppointmentService {
  async getAllByAccount(accountId) {
    return await appointmentRepository.getAllByAccount(accountId);
  }

  async createAppointment(data) {
    await appointmentRepository.createAppointment(data);
    return { message: "Đặt lịch thành công" };
  }

  async confirmAppointment(appointmentId, staffId) {
    await appointmentRepository.confirmAppointment(appointmentId, staffId);
    return { message: "Lịch hẹn đã được xác nhận" };
  }

  async cancelAppointment(appointmentId) {
    await appointmentRepository.cancelAppointment(appointmentId);
    return { message: "Đã hủy lịch hẹn" };
  }
}

module.exports = new AppointmentService();
