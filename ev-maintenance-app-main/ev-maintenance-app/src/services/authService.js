// src/services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const accountRepository = require('../repositories/accountRepository');

function signToken(acc) {
  // nhúng cả sub và AccountID để code cũ/mới đều đọc được
  return jwt.sign(
    {
      sub: acc.AccountID,
      AccountID: acc.AccountID,
      Username: acc.Username,
      Role: acc.Role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

class AuthService {
  async register(data) {
    const { username, password, fullName, email, phone, address } = data;

    const existed = await accountRepository.getAccountByUsername(username);
    if (existed) throw new Error('Tên đăng nhập đã tồn tại');

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await accountRepository.createAccount({
      username,
      passwordHash,
      role: 'Customer',
      fullName,
      email,
      phone,
      address,
    });

    const token = signToken(created);
    return { token, user: created };
  }

  async login(username, password) {
    const acc = await accountRepository.getAccountByUsername(username);
    if (!acc) throw new Error('Sai tài khoản hoặc mật khẩu');

    if (acc.Status && acc.Status !== 'Active') {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    const ok = await bcrypt.compare(password, acc.PasswordHash || '');
    if (!ok) throw new Error('Sai tài khoản hoặc mật khẩu');

    const token = signToken(acc);
    // Ẩn PasswordHash trước khi trả ra
    const { PasswordHash, ...safe } = acc;
    return { token, user: safe };
  }
}

module.exports = new AuthService();
