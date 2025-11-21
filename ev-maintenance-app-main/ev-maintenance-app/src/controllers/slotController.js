// controllers/slotController.js
const slotService = require("../services/slotService");

exports.freeByDate = async (req, res) => {
  try {
    const { date } = req.query; // yyyy-mm-dd
    if (!date) return res.status(400).json({ success: false, message: "Thiếu tham số date" });
    const rows = await slotService.getFreeByDate(date);
    res.json({ success: true, slots: rows });
  } catch (e) {
    res.status(400).json({ success: false, message: "Không lấy được slot", error: e.message });
  }
};

exports.listAll = async (req, res) => {
  try {
    const filters = {
      date: req.query.date || undefined,
      status: req.query.status || undefined,
    };
    const rows = await slotService.listAll(filters);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await slotService.getById(Number(id));
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    res.json({ success: true, data: slot });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { staffId, startTime, endTime, capacity, status } = req.body;
    const slot = await slotService.create({
      staffId: Number(staffId),
      startTime,
      endTime,
      capacity: capacity ? Number(capacity) : 4,
      status: status || 'Free',
    });
    res.json({ success: true, data: slot });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, capacity, status } = req.body;
    const slot = await slotService.update(Number(id), {
      startTime,
      endTime,
      capacity: capacity ? Number(capacity) : undefined,
      status,
    });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    res.json({ success: true, data: slot });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await slotService.delete(Number(id));
    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Server error' });
  }
};
