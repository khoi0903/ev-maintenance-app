// src/routes/reminderRoutes.js
const express = require("express");
const router = express.Router();
const reminderController = require("../controllers/reminderController");
const { auth } = require("../middlewares/authMiddleware");
const { role } = require("../middlewares/roleMiddleware");

// Staff/Admin: xem Pending
router.get("/pending", auth, role("Staff","Admin"), reminderController.getPending);

// Staff/Admin: đánh dấu đã gửi
router.patch("/:id/sent", auth, role("Staff","Admin"), reminderController.markAsSent);

// (tuỳ chọn) Customer xem theo vehicle
 router.get("/vehicle/:vehicleId", auth, reminderController.getByVehicle);

module.exports = router;
