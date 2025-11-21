const eventRepo = require('../repositories/eventRepository');

class EventService {
  async getRecent(limit = 20) {
    return await eventRepo.getRecent(limit);
  }
}

module.exports = new EventService();


