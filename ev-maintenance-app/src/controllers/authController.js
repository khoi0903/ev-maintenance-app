const authService = require("../services/authService");

// Đăng ký Customer
exports.registerCustomer = async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;
    const result = await authService.registerCustomer({
      username,
      password,
      fullName,
      email,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi đăng ký", error: err.message });
  }
};

// Admin tạo tài khoản Staff/Technician/Admin
exports.createAccountByAdmin = async (req, res) => {
  try {
    const { username, password, role, fullName, email } = req.body;
    const result = await authService.createAccountByAdmin({
      username,
      password,
      role,
      fullName,
      email,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi admin tạo tài khoản", error: err.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login({ username, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ message: "Lỗi đăng nhập", error: err.message });
  }
};
