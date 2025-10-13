const reportService = require("../services/reportService");

exports.getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await reportService.getRevenueByDateRange(startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy báo cáo doanh thu", error: error.message });
  }
};

exports.getRevenueByTechnician = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await reportService.getRevenueByTechnician(startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy doanh thu theo kỹ thuật viên", error: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const result = await reportService.getSystemSummary();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy thống kê hệ thống", error: error.message });
  }
};
