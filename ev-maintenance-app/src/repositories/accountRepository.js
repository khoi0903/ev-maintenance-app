const { sql, poolPromise } = require("../db");

class AccountRepository {
  async getAccountByUsername(username) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query(`SELECT * FROM Account WHERE Username = @username AND Status = 'Active'`);
    return result.recordset[0];
  }

  async getAccountById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`SELECT * FROM Account WHERE AccountID = @id AND Status = 'Active'`);
    return result.recordset[0];
  }

  async createAccount({ username, passwordHash, role, fullName, email }) {
    const pool = await poolPromise;
    await pool.request()
      .input("username", sql.NVarChar, username)
      .input("passwordHash", sql.NVarChar, passwordHash) // bcrypt string
      .input("role", sql.NVarChar, role)
      .input("fullName", sql.NVarChar, fullName)
      .input("email", sql.NVarChar, email)
      .query(`
        INSERT INTO Account (Username, PasswordHash, Role, FullName, Email)
        VALUES (@username, @passwordHash, @role, @fullName, @email)
      `);
  }

  async updateAccount(id, { fullName, email, phone, address }) {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("fullName", sql.NVarChar, fullName)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone)
      .input("address", sql.NVarChar, address)
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

  async deactivateAccount(id) {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Account
        SET Status = 'Inactive',
            UpdatedAt = @updatedAt
        WHERE AccountID = @id
      `);
  }
}

module.exports = new AccountRepository();
