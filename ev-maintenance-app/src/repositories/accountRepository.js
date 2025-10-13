// src/repositories/accountRepository.js
// Repository quản lý bảng Account
// Sử dụng poolPromise (đã chuẩn hoá)

const { poolPromise, sql } = require("../db");

class AccountRepository {
  // Lấy account theo username (chỉ account Active)
  async getAccountByUsername(username) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("username", sql.NVarChar(50), username)
      .query("SELECT * FROM Account WHERE Username = @username AND Status = 'Active'");
    return r.recordset[0];
  }

  // Lấy account theo id (bỏ trạng thái filter để admin có thể truy vấn)
  async getAccountById(id) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Account WHERE AccountID = @id");
    return r.recordset[0];
  }

  // Tạo account mới (passwordHash có thể là chuỗi bcrypt hoặc varbinary - phù hợp với DB của bạn)
  async createAccount({ username, passwordHash, role, fullName, email, phone, address }) {
    const pool = await poolPromise;
    await pool.request()
      .input("username", sql.NVarChar(50), username)
      .input("passwordHash", sql.NVarChar(sql.MAX), passwordHash) // nếu DB là VARBINARY, sửa type tương ứng
      .input("role", sql.NVarChar(20), role)
      .input("fullName", sql.NVarChar(100), fullName)
      .input("email", sql.NVarChar(100), email || null)
      .input("phone", sql.NVarChar(20), phone || null)
      .input("address", sql.NVarChar(200), address || null)
      .query(`
        INSERT INTO Account (Username, PasswordHash, Role, FullName, Email, Phone, Address)
        VALUES (@username, @passwordHash, @role, @fullName, @email, @phone, @address)
      `);
  }

  // Cập nhật profile (không đổi mật khẩu ở đây)
  async updateAccount(id, { fullName, email, phone, address }) {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("fullName", sql.NVarChar(100), fullName)
      .input("email", sql.NVarChar(100), email)
      .input("phone", sql.NVarChar(20), phone)
      .input("address", sql.NVarChar(200), address)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Account
        SET FullName = @fullName,
            Email = @email,
            Phone = @phone,
            Address = @address,
            UpdatedAt = @updatedAt
        WHERE AccountID = @id
      `);
  }

  // Vô hiệu hóa tài khoản thay vì xóa
  async deactivateAccount(id) {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Account
        SET Status = 'Inactive', UpdatedAt = @updatedAt
        WHERE AccountID = @id
      `);
  }
}

module.exports = new AccountRepository();
