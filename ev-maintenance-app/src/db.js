// src/db.js
const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log("✅ Đã kết nối SQL Server");
    } catch (err) {
      console.error("❌ Lỗi kết nối SQL Server:", err);
      throw err;
    }
  }
  return pool;
}

module.exports = { sql, getPool };
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(async pool => {
    console.log("✅ Kết nối SQL Server thành công");

  

    return pool;
  })
  .catch(err => {
    console.error("❌ Lỗi kết nối SQL Server:", err);
    throw err;
  });