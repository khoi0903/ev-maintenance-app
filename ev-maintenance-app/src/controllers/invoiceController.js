// src/controllers/invoiceController.js
const invoiceService = require("../services/invoiceService");

exports.create = async (req, res) => {
  try {
    const result = await invoiceService.create(req.body);
    res.status(201).json({ success: true, message: "Tạo hóa đơn thành công", data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi tạo hóa đơn", error: error.message });
  }
};

exports.getByWorkOrder = async (req, res) => {
  try {
    const result = await invoiceService.getByWorkOrder(req.params.workOrderId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy hóa đơn", error: error.message });
  }
};

exports.markAsPaid = async (req, res) => {
  try {
    const result = await invoiceService.markAsPaid(req.params.id);
    res.json({ success: true, message: "Cập nhật hóa đơn thành công", data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi cập nhật hóa đơn", error: error.message });
  }
};

// ✅ Xuất PDF hóa đơn có QR thanh toán thật
exports.exportInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const result = await invoiceService.exportInvoicePdf(invoiceId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xuất PDF", error: error.message });
  }
};
