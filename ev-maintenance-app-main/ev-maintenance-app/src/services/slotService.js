const slotRepo = require('../repositories/slotRepository');

class SlotService {
  async getFreeByDate(dateStr) {
    return await slotRepo.getFreeByDate(dateStr);
  }

  async getById(slotId) {
    return await slotRepo.getById(slotId);
  }

  async listAll(filters = {}) {
    return await slotRepo.listAll(filters);
  }

  async create(data) {
    if (!data.staffId || !data.startTime || !data.endTime) {
      throw new Error('Missing required fields: staffId, startTime, endTime');
    }
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new Error('StartTime must be before EndTime');
    }
    return await slotRepo.create(data);
  }

  async update(slotId, data) {
    if (data.startTime && data.endTime && new Date(data.startTime) >= new Date(data.endTime)) {
      throw new Error('StartTime must be before EndTime');
    }
    return await slotRepo.update(slotId, data);
  }

  async delete(slotId) {
    return await slotRepo.delete(slotId);
  }
}

module.exports = new SlotService();
