// src/repositories/technicianRepository.js
const { poolPromise, sql } = require('../db');

class TechnicianRepository {
  async listAllTechnicians() {
    const pool = await poolPromise;
    const rs = await pool.request().query(`
      SELECT 
        AccountID,
        FullName,
        Phone,
        Email
      FROM Account
      WHERE Role = 'Technician'
        AND IsActive = 1
    `);
    return rs.recordset || [];
  }
}

module.exports = new TechnicianRepository();
