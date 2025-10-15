// src/repositories/accountRepository.js (patched)
const { poolPromise, sql } = require("../db");

class AccountRepository {
  async getAccountByUsername(username) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("username", sql.NVarChar(50), username)
      .query("SELECT * FROM Account WHERE Username = @username AND Status = 'Active'");
    return r.recordset[0];
  }

  async getAccountById(id) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Account WHERE AccountID = @id");
    return r.recordset[0];
  }

  async getAll() {
    const pool = await poolPromise;
    const r = await pool.request().query("SELECT * FROM Account ORDER BY CreatedAt DESC");
    return r.recordset;
  }

  async createAccount({ username, passwordHash, role, fullName, email, phone, address }) {
    const pool = await poolPromise;
    await pool.request()
      .input("username", sql.NVarChar(50), username)
      .input("passwordHash", sql.NVarChar(sql.MAX), passwordHash)
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

  // ✅ Partial update
  async updateAccount(accountId, data) {
    const pool = await poolPromise;
    const req = pool.request().input("AccountID", sql.Int, accountId);
    const fields = [];

    const current = await this.getAccountById(accountId);
    if (!current) throw new Error("Không tìm thấy tài khoản");

    if (data.fullName !== undefined) {
      req.input("FullName", sql.NVarChar(100), data.fullName);
      fields.push("FullName = @FullName");
    }
    if (data.email !== undefined) {
      req.input("Email", sql.NVarChar(100), data.email);
      fields.push("Email = @Email");
    }
    if (data.phone !== undefined) {
      req.input("Phone", sql.NVarChar(20), data.phone);
      fields.push("Phone = @Phone");
    }
    if (data.address !== undefined) {
      req.input("Address", sql.NVarChar(200), data.address);
      fields.push("Address = @Address");
    }
    if (data.gender !== undefined) {
      req.input("Gender", sql.NVarChar(10), data.gender);
      fields.push("Gender = @Gender");
    }

    if (fields.length === 0) return;

    req.input("updatedAt", sql.DateTime2, new Date());
    fields.push("UpdatedAt = @updatedAt");

    const q = `UPDATE Account SET ${fields.join(", ")} WHERE AccountID = @AccountID`;
    await req.query(q);
  }

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
