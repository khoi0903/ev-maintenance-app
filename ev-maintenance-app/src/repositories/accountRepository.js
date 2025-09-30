const pool = require("../db");

class AccountRepository {
  async getAccountByUsername(username) {
    const result = await pool
      .request()
      .input("username", username)
      .query("SELECT * FROM Account WHERE Username = @username AND Status = 'Active'");
    return result.recordset[0];
  }

  async getAccountById(id) {
    const result = await pool
      .request()
      .input("id", id)
      .query("SELECT * FROM Account WHERE AccountID = @id AND Status = 'Active'");
    return result.recordset[0];
  }

  async createAccount({ username, passwordHash, role, fullName, email }) {
    await pool
      .request()
      .input("username", username)
      .input("passwordHash", Buffer.from(passwordHash, "utf-8"))
      .input("role", role)
      .input("fullName", fullName)
      .input("email", email)
      .query(`
        INSERT INTO Account (Username, PasswordHash, Role, FullName, Email)
        VALUES (@username, @passwordHash, @role, @fullName, @email)
      `);
  }

  async updateAccount(id, { fullName, email, phone, address }) {
    await pool
      .request()
      .input("id", id)
      .input("fullName", fullName)
      .input("email", email)
      .input("phone", phone)
      .input("address", address)
      .input("updatedAt", new Date())
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
    await pool
      .request()
      .input("id", id)
      .input("updatedAt", new Date())
      .query(`
        UPDATE Account
        SET Status = 'Inactive',
            UpdatedAt = @updatedAt
        WHERE AccountID = @id
      `);
  }
}

module.exports = new AccountRepository();
