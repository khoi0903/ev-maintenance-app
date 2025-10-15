const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { verifyToken } = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// Tạo hóa đơn (Staff/Admin)
router.post("/", verifyToken, role(["Staff","Admin"]), invoiceController.create);

// Lấy hóa đơn theo WorkOrder (đã xác thực)
router.get("/workorder/:workOrderId", verifyToken, invoiceController.getByWorkOrder);

// Đánh dấu đã thanh toán (Staff/Admin)
router.put("/markpaid/:id", verifyToken, role(["Staff","Admin"]), invoiceController.markAsPaid);

// Xuất PDF (đã xác thực)
router.get("/export/:invoiceId", verifyToken, invoiceController.exportInvoice);

module.exports = router;
