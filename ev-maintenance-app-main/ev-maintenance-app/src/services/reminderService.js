// src/services/reminderService.js
const reminderRepository = require("../repositories/reminderRepository");

class ReminderService {
  async getPendingReminders() {
    return reminderRepository.getPending();
  }

  async markAsSent(reminderId) {
    const updated = await reminderRepository.markAsSent(reminderId);
    return { message: "Đánh dấu nhắc nhở đã gửi thành công", data: updated };
  }

  async getByVehicle(vehicleId) {
    return reminderRepository.getByVehicleId(vehicleId);
  }
}

module.exports = new ReminderService();
