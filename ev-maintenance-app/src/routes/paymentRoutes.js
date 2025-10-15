// src/routes/paymentRoutes.js (patched)
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, paymentController.create);
router.get("/:invoiceId", verifyToken, paymentController.getPayments);
// Callback từ VNPay (public)
router.get("/vnpay_return", paymentController.vnpayReturn);

module.exports = router;
