const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const accountRepository = require("../repositories/accountRepository");

class AuthService {
  async register(data) {
    const { username, password, fullName, email, phone, address } = data;

    const existing = await accountRepository.getAccountByUsername(username);
    if (existing) throw new Error("Tên đăng nhập đã tồn tại");

    const passwordHash = await bcrypt.hash(password, 10);
    await accountRepository.createAccount({
      username,
      passwordHash,
      role: "Customer",
      fullName,
      email,
      phone,
      address,
    });

    return { message: "Đăng ký thành công, vui lòng đăng nhập" };
  }

  async login(username, password) {
    const account = await accountRepository.getAccountByUsername(username);
    if (!account) throw new Error("Sai tên đăng nhập hoặc mật khẩu");

    const valid = await bcrypt.compare(password, account.PasswordHash);
    if (!valid) throw new Error("Sai tên đăng nhập hoặc mật khẩu");

    const token = jwt.sign(
      { id: account.AccountID, role: account.Role, name: account.FullName },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return { message: "Đăng nhập thành công", token, user: account };
  }
}

module.exports = new AuthService();
