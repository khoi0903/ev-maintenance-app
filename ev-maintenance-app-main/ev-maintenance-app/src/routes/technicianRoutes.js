const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { role } = require("../middlewares/roleMiddleware");
const allow = (...roles) => [auth, role(...roles)];
const accountController = require("../controllers/accountController");

// Lấy tất cả technician đang Active
router.get(
  "/",
  allow("Admin", "Staff"),
  accountController.getTechnicians
);

module.exports = router;
