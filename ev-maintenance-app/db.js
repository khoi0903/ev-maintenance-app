const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function getConnection() {
  if (sql.connected) return sql;
  await sql.connect(dbConfig);
  return sql;
}

module.exports = { getConnection, sql };
