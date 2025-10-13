const appointmentRepository = require("../repositories/appointmentRepository");

class AppointmentService {
  async getAllByAccount(accountId) {
    return await appointmentRepository.getAllByAccount(accountId);
  }

  async createAppointment(data) {
    await appointmentRepository.create(data);
    return { message: "Đặt lịch thành công" };
  }

  async confirmAppointment(appointmentId, staffId) {
    await appointmentRepository.confirm(appointmentId, staffId);
    return { message: "Lịch hẹn đã được xác nhận" };
  }

  async cancelAppointment(appointmentId) {
    await appointmentRepository.cancel(appointmentId);
    return { message: "Đã hủy lịch hẹn" };
  }
}

module.exports = new AppointmentService();
