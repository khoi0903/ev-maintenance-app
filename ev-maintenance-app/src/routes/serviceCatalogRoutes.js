const express = require("express");
const router = express.Router();
const serviceCatalogController = require("../controllers/serviceCatalogController");
const { verifyToken } = require("../middlewares/authMiddleware");

// 🔹 Lấy danh sách tất cả dịch vụ
router.get("/", verifyToken, serviceCatalogController.getAllServices);

// 🔹 Thêm dịch vụ mới (chỉ Admin)
router.post("/", verifyToken, serviceCatalogController.createService);

// 🔹 Cập nhật dịch vụ
router.put("/:id", verifyToken, serviceCatalogController.updateService);

// 🔹 Xóa dịch vụ
router.delete("/:id", verifyToken, serviceCatalogController.deleteService);

module.exports = router;
