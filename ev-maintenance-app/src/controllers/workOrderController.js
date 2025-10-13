const workOrderService = require("../services/workOrderService");

exports.create = async (req, res) => {
  try {
    const result = await workOrderService.create(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi tạo phiếu sửa chữa", error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const result = await workOrderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi cập nhật trạng thái", error: error.message });
  }
};

exports.getByAppointment = async (req, res) => {
  try {
    const result = await workOrderService.getByAppointment(req.params.appointmentId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin phiếu sửa chữa", error: error.message });
  }
};
