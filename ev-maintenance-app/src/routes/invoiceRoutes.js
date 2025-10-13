const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { verifyToken } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🔹 Tạo hóa đơn
router.post("/", invoiceController.create);

// 🔹 Lấy hóa đơn theo WorkOrder
router.get("/workorder/:workOrderId", invoiceController.getByWorkOrder);

// 🔹 Cập nhật trạng thái đã thanh toán
router.put("/markpaid/:id", invoiceController.markAsPaid);

// ✅ Xuất PDF hóa đơn có QR thanh toán thật
router.get("/export/:invoiceId", invoiceController.exportInvoice);

module.exports = router;







module.exports = router;
