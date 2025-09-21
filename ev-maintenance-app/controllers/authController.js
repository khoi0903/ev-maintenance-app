const { getConnection, sql } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Validate password: >=6 ký tự, gồm chữ và số
function validPassword(pw) {
  if (!pw || pw.length < 6) return false;
  return /[A-Za-z]/.test(pw) && /\d/.test(pw);
}

// Register
const register = async (req, res) => {
  const { username, password, role = 'customer' } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username và password là bắt buộc' });
  }
  if (!validPassword(password)) {
    return res.status(400).json({ message: 'Password phải >=6 ký tự, có cả chữ và số' });
  }

  try {
    const pool = await getConnection();

    // Check trùng username
    const exists = await pool.request()
      .input('username', sql.VarChar(100), username)
      .query('SELECT AccountID FROM Account WHERE Username = @username');

    if (exists.recordset.length > 0) {
      return res.status(409).json({ message: 'Username đã tồn tại' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.request()
      .input('username', sql.VarChar(100), username)
      .input('passwordHash', sql.VarChar(sql.MAX), hashed)
      .input('role', sql.VarChar(50), role)
      .query(`
        INSERT INTO Account (Username, PasswordHash, Role, Status, CreatedDate)
        VALUES (@username, @passwordHash, @role, 'Active', GETDATE())
      `);

    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Login
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username và password là bắt buộc' });

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.VarChar(100), username)
      .query('SELECT AccountID, Username, PasswordHash, Role FROM Account WHERE Username = @username');

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

    const token = jwt.sign(
      { accountId: user.AccountID, username: user.Username, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Đăng nhập thành công', token, accountId: user.AccountID, role: user.Role });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { register, login };
