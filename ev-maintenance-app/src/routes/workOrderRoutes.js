const express = require("express");
const router = express.Router();
const workOrderController = require("../controllers/workOrderController");
const { verifyToken } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🔹 Tạo phiếu sửa chữa
router.post("/", verifyToken, roleMiddleware(["Staff", "Admin"]), workOrderController.create);

// 🔹 Cập nhật trạng thái phiếu sửa chữa
router.put("/:id/status", verifyToken, roleMiddleware(["Technician", "Staff", "Admin"]), workOrderController.updateStatus);

// 🔹 Lấy phiếu theo lịch hẹn
router.get("/appointment/:appointmentId", verifyToken, workOrderController.getByAppointment);

module.exports = router;
