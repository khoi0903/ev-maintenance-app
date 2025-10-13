const serviceCatalogService = require("../services/serviceCatalogService");

exports.getAllServices = async (req, res) => {
  try {
    const data = await serviceCatalogService.getAllServices();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách dịch vụ", error: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    await serviceCatalogService.createService(req.body);
    res.status(201).json({ message: "Tạo dịch vụ thành công" });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi tạo dịch vụ", error: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    await serviceCatalogService.updateService(req.params.id, req.body);
    res.json({ message: "Cập nhật dịch vụ thành công" });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật dịch vụ", error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await serviceCatalogService.deleteService(req.params.id);
    res.json({ message: "Xóa dịch vụ thành công" });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi xóa dịch vụ", error: err.message });
  }
};
