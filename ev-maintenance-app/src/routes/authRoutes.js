const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/roleMiddleware");

// 🔹 Customer tự đăng ký
router.post("/register", authController.registerCustomer);

// 🔹 Admin tạo tài khoản Staff/Technician/Admin
router.post("/create", verifyToken, isAdmin, authController.createAccountByAdmin);

// 🔹 Login chung
router.post("/login", authController.login);

module.exports = router;
