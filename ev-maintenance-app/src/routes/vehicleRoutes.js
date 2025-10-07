const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { verifyToken } = require("../middlewares/authMiddleware");

// 🔹 Lấy danh sách xe của user
router.get("/", verifyToken, vehicleController.getVehicles);

// 🔹 Thêm xe mới
router.post("/", verifyToken, vehicleController.createVehicle);

// 🔹 Cập nhật xe
router.put("/:id", verifyToken, vehicleController.updateVehicle);

// 🔹 Vô hiệu hóa xe
router.put("/:id/deactivate", verifyToken, vehicleController.deactivateVehicle);

module.exports = router;
