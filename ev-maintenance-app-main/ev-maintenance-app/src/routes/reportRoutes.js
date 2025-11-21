const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { auth } = require("../middlewares/authMiddleware");
const { role } = require("../middlewares/roleMiddleware");

// 📈 Doanh thu theo khoảng ngày: ?startDate=2025-10-01&endDate=2025-10-31
router.get(
  "/revenue/date-range",
  auth,
  role("Admin"), // 👉 Nếu muốn Staff xem: role("Admin", "Staff")
  reportController.getRevenueByDateRange
);

// 👨‍🔧 Doanh thu theo kỹ thuật viên (lọc theo khoảng ngày)
router.get(
  "/revenue/by-technician",
  auth,
  role("Admin"), // 👉 Nếu muốn Staff xem: role("Admin", "Staff")
  reportController.getRevenueByTechnician
);

// 📊 Tổng quan hệ thống
router.get(
  "/summary",
  auth,
  role("Admin"), // 👉 Nếu muốn Staff xem: role("Admin", "Staff")
  reportController.getSummary
);

router.get(
  "/workorders/monthly",
  auth,
  role("Admin", "Staff"),
  reportController.getMonthlyWorkOrderTrend
);

module.exports = router;
