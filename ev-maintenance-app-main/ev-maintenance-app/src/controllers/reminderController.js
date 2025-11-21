const reminderService = require("../services/reminderService");

exports.getPending = async (req, res) => {
  try {
    const result = await reminderService.getPendingReminders();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy nhắc nhở", error: error.message });
  }
};

exports.markAsSent = async (req, res) => {
  try {
    const result = await reminderService.markAsSent(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi đánh dấu nhắc nhở", error: error.message });
  }
};
exports.getByVehicle = async (req, res) => {
  try {
    const result = await reminderService.getByVehicle(req.params.vehicleId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy nhắc nhở theo xe", error: error.message });
  }
};  
  