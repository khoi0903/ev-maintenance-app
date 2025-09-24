require("dotenv").config();
const express = require("express");
const authController = require("./controllers/authController");
const authMiddleware = require("./middlewares/authMiddleware");
const roleMiddleware = require("./middlewares/roleMiddleware");

const app = express();
app.use(express.json());

// Public routes
app.post("/register", authController.registerCustomer); // khách hàng
app.post("/login", authController.login);

// Private routes
app.get("/profile", authMiddleware, (req, res) => {
  res.json({
    accountId: req.user.accountId,
    role: req.user.role,
    message: "Welcome to your profile",
  });
});

// Admin-only: tạo Staff/Technician/Admin
app.post(
  "/admin/create-account",
  authMiddleware,
  roleMiddleware(["Admin"]),
  authController.createAccountByAdmin
);

app.get("/admin-only", authMiddleware, roleMiddleware(["Admin"]), (req, res) => {
  res.json({ message: "Hello Admin!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
