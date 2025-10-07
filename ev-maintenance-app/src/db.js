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
    encrypt: false, // nếu deploy Azure đổi true
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Kết nối SQL Server thành công");
    return pool;
  })
  .catch(err => {
    console.error("❌ Lỗi kết nối SQL Server:", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
