const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verifyToken } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🔹 Báo cáo doanh thu theo thời gian
router.get("/revenue", verifyToken, roleMiddleware(["Admin", "Staff"]), reportController.getRevenueByDateRange);

// 🔹 Báo cáo doanh thu theo kỹ thuật viên
router.get("/technician", verifyToken, roleMiddleware(["Admin"]), reportController.getRevenueByTechnician);

// 🔹 Tổng hợp hệ thống
router.get("/summary", verifyToken, roleMiddleware(["Admin"]), reportController.getSummary);

module.exports = router;
