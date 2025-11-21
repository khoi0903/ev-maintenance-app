const notificationRepo = require('../repositories/notificationRepository');

class NotificationService {
  async getAll(limit = 20, userId = null) {
    return await notificationRepo.getAll(limit, userId);
  }

  async markAsRead(userId, notificationId) {
    return await notificationRepo.markAsRead(userId, notificationId);
  }
}

module.exports = new NotificationService();


