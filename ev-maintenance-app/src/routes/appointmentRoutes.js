const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { verifyToken } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🔹 Lấy danh sách lịch hẹn của người dùng
router.get("/", verifyToken, appointmentController.getAll);

// 🔹 Tạo lịch hẹn mới
router.post("/", verifyToken, appointmentController.create);

// 🔹 Nhân viên xác nhận lịch hẹn
router.put("/:id/confirm", verifyToken, roleMiddleware(["Staff", "Admin"]), appointmentController.confirm);

// 🔹 Hủy lịch hẹn
router.put("/:id/cancel", verifyToken, appointmentController.cancel);

module.exports = router;
