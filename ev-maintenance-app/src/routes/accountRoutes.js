const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { verifyToken } = require("../middlewares/authMiddleware");

// 🔹 Lấy thông tin cá nhân
router.get("/me", verifyToken, accountController.getProfile);

// 🔹 Cập nhật thông tin cá nhân
router.put("/update", verifyToken, accountController.updateProfile);

// 🔹 Vô hiệu hóa tài khoản
router.put("/deactivate", verifyToken, accountController.deactivateAccount);

module.exports = router;
