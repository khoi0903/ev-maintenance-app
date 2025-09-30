const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const accountRepository = require("../repositories/accountRepository");

class AuthService {
  // Khách hàng tự đăng ký
  async registerCustomer({ username, password, fullName, email }) {
    const existUser = await accountRepository.getAccountByUsername(username);
    if (existUser) throw new Error("Username already exists");

    const passwordHash = await bcrypt.hash(password, 10);

    await accountRepository.createAccount({
      username,
      passwordHash,
      role: "Customer", // luôn Customer
      fullName: fullName || "NoName",
      email: email || null,
    });

    return { message: "Register successful as Customer" };
  }

  // Admin tạo Staff/Technician/Admin
  async createAccountByAdmin({ username, password, role, fullName, email }) {
    if (!["Staff", "Technician", "Admin"].includes(role)) {
      throw new Error("Invalid role for admin creation");
    }

    const existUser = await accountRepository.getAccountByUsername(username);
    if (existUser) throw new Error("Username already exists");

    const passwordHash = await bcrypt.hash(password, 10);

    await accountRepository.createAccount({
      username,
      passwordHash,
      role,
      fullName: fullName || "NoName",
      email: email || null,
    });

    return { message: `Account created successfully as ${role}` };
  }

  // Đăng nhập
  async login({ username, password }) {
    const user = await accountRepository.getAccountByUsername(username);
    if (!user) throw new Error("Invalid username or password");

    const match = await bcrypt.compare(password, user.PasswordHash.toString());
    if (!match) throw new Error("Invalid username or password");

    const token = jwt.sign(
      { accountId: user.AccountID, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return { token, accountId: user.AccountID, role: user.Role };
  }
}

module.exports = new AuthService();
