const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const accountRepository = require("../repositories/accountRepository");

class AuthService {
  async register(data) {
    const { username, password, fullName, email, phone, address } = data;
    const existing = await accountRepository.getByUsername(username);
    if (existing) throw new Error("Tên đăng nhập đã tồn tại");

    const passwordHash = await bcrypt.hash(password, 10);
    await accountRepository.create({
      Username: username,
      PasswordHash: passwordHash,
      FullName: fullName,
      Email: email,
      Phone: phone,
      Address: address,
      Role: "Customer",
    });
    return { message: "Đăng ký thành công, vui lòng đăng nhập" };
  }

  async login(username, password) {
    const account = await accountRepository.getByUsername(username);
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
