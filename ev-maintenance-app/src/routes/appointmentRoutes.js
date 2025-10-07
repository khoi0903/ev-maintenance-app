const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { isStaff } = require("../middlewares/roleMiddleware");

// 🔹 Khách hàng đặt lịch
router.post("/", verifyToken, appointmentController.createAppointment);

// 🔹 Xem lịch hẹn của mình
router.get("/", verifyToken, appointmentController.getAppointments);

// 🔹 Staff xác nhận (và gán technician)
router.put("/:appointmentId/confirm", verifyToken, isStaff, appointmentController.confirmAppointment);

// 🔹 Hủy lịch
router.put("/:appointmentId/cancel", verifyToken, appointmentController.cancelAppointment);

module.exports = router;
