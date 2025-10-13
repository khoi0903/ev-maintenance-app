const reminderRepository = require("../repositories/reminderRepository");

class ReminderService {
  async getPendingReminders() {
    return await reminderRepository.getPending();
  }

  async markAsSent(reminderId) {
    await reminderRepository.markAsSent(reminderId);
    return { message: "Đánh dấu nhắc nhở đã gửi thành công" };
  }

  async getByVehicle(vehicleId) {
    return await reminderRepository.getByVehicle(vehicleId);
  }
}

module.exports = new ReminderService();
