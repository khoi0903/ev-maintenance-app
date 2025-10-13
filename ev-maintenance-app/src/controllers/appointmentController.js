const appointmentService = require("../services/appointmentService");

exports.getAll = async (req, res) => {
  try {
    const result = await appointmentService.getAllByAccount(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách lịch hẹn", error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const result = await appointmentService.createAppointment({ accountId: req.user.id, ...req.body });
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi tạo lịch hẹn", error: error.message });
  }
};

exports.confirm = async (req, res) => {
  try {
    const result = await appointmentService.confirmAppointment(req.params.id, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi xác nhận lịch hẹn", error: error.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const result = await appointmentService.cancelAppointment(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi hủy lịch hẹn", error: error.message });
  }
};
