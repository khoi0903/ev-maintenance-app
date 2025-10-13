const vehicleService = require("../services/vehicleService");

exports.getAll = async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllByAccount(req.user.id);
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách xe", error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const result = await vehicleService.createVehicle({ accountId: req.user.id, ...req.body });
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi thêm xe mới", error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const result = await vehicleService.updateVehicle(req.params.id, req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi cập nhật xe", error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await vehicleService.deleteVehicle(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi xóa xe", error: error.message });
  }
};
