const { sql, poolPromise } = require("../db");

// Tạo account
async function createAccount({ username, passwordHash, role, fullName, email }) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("Username", sql.NVarChar, username)
    .input("PasswordHash", sql.NVarChar, passwordHash)
    .input("Role", sql.NVarChar, role)
    .input("FullName", sql.NVarChar, fullName)
    .input("Email", sql.NVarChar, email)
    .query(`
      INSERT INTO Account (Username, PasswordHash, Role, FullName, Email)
      OUTPUT INSERTED.*
      VALUES (@Username, @PasswordHash, @Role, @FullName, @Email)
    `);
  return result.recordset[0];
}

// Lấy account theo username
async function getAccountByUsername(username) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("Username", sql.NVarChar, username)
    .query("SELECT * FROM Account WHERE Username = @Username");
  return result.recordset[0];
}

module.exports = { createAccount, getAccountByUsername };
