const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { verifyToken } = require("../middlewares/authMiddleware");

// 🔹 Lấy tất cả xe của người dùng
router.get("/", verifyToken, vehicleController.getAll);

// 🔹 Thêm xe mới
router.post("/", verifyToken, vehicleController.create);

// 🔹 Cập nhật xe
router.put("/:id", verifyToken, vehicleController.update);

// 🔹 Xóa (vô hiệu hóa) xe
router.delete("/:id", verifyToken, vehicleController.delete);

module.exports = router;
