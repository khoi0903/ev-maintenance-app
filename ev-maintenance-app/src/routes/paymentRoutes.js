// src/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/", paymentController.create);
router.get("/:invoiceId", paymentController.getPayments);
router.get("/vnpay_return", paymentController.vnpayReturn); // callback

module.exports = router;
