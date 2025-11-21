// src/repositories/accountRepository.js
const { poolPromise, sql } = require("../db");

class AccountRepository {
  async getAccountByUsername(username) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input("username", sql.NVarChar(50), username)
      .query(`
        SELECT AccountID, Username, PasswordHash, Role, Status, FullName, Email, Phone, Address
        FROM Account
        WHERE Username = @username
      `);
    return rs.recordset[0];
  }

  async getAccountById(id) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT AccountID, Username, Role, Status, FullName, Email, Phone, Address
        FROM Account
        WHERE AccountID = @id
      `);
    return rs.recordset[0];
  }
async  getById(id) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT 
        AccountID,
        Username,
        Role,
        FullName,
        Phone,
        Email,
        Address,
        Status,
        CreatedAt,
        UpdatedAt
      FROM dbo.Account
      WHERE AccountID = @id
    `);

  // trả về 1 object hoặc null
  return rs.recordset[0] || null;
}
  async getAll() {
    const pool = await poolPromise;
    const rs = await pool.request()
      .query(`SELECT AccountID, Username, Role, Status, FullName, Email, Phone, Address, CreatedAt
              FROM Account
              ORDER BY CreatedAt DESC`);
    return rs.recordset;
  }

  async getTechnicians() {
    const pool = await poolPromise;
    const rs = await pool.request()
      .query(`SELECT AccountID, Username, Role, Status, FullName, Email, Phone, Address, CreatedAt
              FROM Account
              WHERE Role = 'Technician' AND Status = 'Active'
              ORDER BY FullName ASC`);
    return rs.recordset;
  }

  async createAccount({ username, passwordHash, role, fullName, email, phone, address, status }) {
    const pool = await poolPromise;
    const req = pool.request()
      .input("Username",     sql.NVarChar(50),  username)
      .input("PasswordHash", sql.NVarChar(sql.MAX), passwordHash)
      .input("Role",         sql.NVarChar(20),  role || "Customer")
      .input("FullName",     sql.NVarChar(150), fullName || null)
      .input("Email",        sql.NVarChar(150), email || null)
      .input("Phone",        sql.NVarChar(30),  phone || null)
      .input("Address",      sql.NVarChar(200), address || null)
      .input("Status",       sql.NVarChar(20),  status || 'Active');

    await req.query(`
      INSERT INTO Account (Username, PasswordHash, Role, FullName, Email, Phone, Address, Status, CreatedAt)
      VALUES (@Username, @PasswordHash, @Role, @FullName, @Email, @Phone, @Address, @Status, SYSUTCDATETIME())
    `);

    const rs = await pool.request()
      .input("username", sql.NVarChar(50), username)
      .query(`SELECT AccountID, Username, Role, Status, FullName, Email, Phone, Address, CreatedAt
              FROM Account WHERE Username = @username`);
    return rs.recordset[0];
  }

  // cập nhật partial, map camelCase -> cột DB
  async updatePartial(accountId, data = {}) {
    const pool = await poolPromise;
    const req = pool.request().input("AccountID", sql.Int, accountId);
    const set = [];

    const put = (db, key, type, len) => {
      if (key in data) {
        const val = data[key];
        if (type === "NVARCHAR") req.input(db, sql.NVarChar(len || 100), val);
        else if (type === "VARCHAR") req.input(db, sql.VarChar(len || 100), val);
        else req.input(db, type, val);
        set.push(`${db} = @${db}`);
      }
    };

    put("FullName", "fullName", "NVARCHAR", 150);
    put("Email",    "email",    "NVARCHAR", 150);
    put("Phone",    "phone",    "NVARCHAR", 30);
    put("Address",  "address",  "NVARCHAR", 200);
    put("Role",     "role",     "NVARCHAR", 20);
    put("Status",   "status",   "NVARCHAR", 20);

    if (!set.length) return this.getAccountById(accountId);

    req.input("UpdatedAt", sql.DateTime2, new Date());
    set.push("UpdatedAt = @UpdatedAt");

    const rs = await req.query(`
      UPDATE Account SET ${set.join(", ")}
      WHERE AccountID = @AccountID;

      SELECT AccountID, Username, Role, Status, FullName, Email, Phone, Address
      FROM Account WHERE AccountID = @AccountID;
    `);
    return rs.recordset[0];
  }

  async deactivateAccount(id) {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("UpdatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Account
        SET Status = 'Inactive', UpdatedAt = @UpdatedAt
        WHERE AccountID = @id
      `);
  }

  async updatePassword(accountId, passwordHash) {
    const pool = await poolPromise;
    await pool.request()
      .input("AccountID", sql.Int, accountId)
      .input("PasswordHash", sql.NVarChar(sql.MAX), passwordHash)
      .input("UpdatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Account
        SET PasswordHash = @PasswordHash,
            UpdatedAt = @UpdatedAt
        WHERE AccountID = @AccountID
      `);

    return this.getAccountById(accountId);
  }
  
}

module.exports = new AccountRepository();
