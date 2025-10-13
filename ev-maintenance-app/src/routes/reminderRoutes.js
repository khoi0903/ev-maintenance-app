const express = require("express");
const router = express.Router();
const reminderController = require("../controllers/reminderController");
const { verifyToken } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🔹 Lấy danh sách nhắc nhở chưa gửi
router.get("/pending", verifyToken, roleMiddleware(["Staff", "Admin"]), reminderController.getPending);

// 🔹 Đánh dấu nhắc nhở đã gửi
router.put("/:id/sent", verifyToken, roleMiddleware(["Staff", "Admin"]), reminderController.markAsSent);

module.exports = router;
