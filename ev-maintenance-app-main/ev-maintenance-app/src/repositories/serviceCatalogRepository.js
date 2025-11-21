// src/repositories/serviceCatalogRepository.js
const { sql, poolPromise } = require('../db');

const SELECT_BASE = `
  SELECT ServiceID, ServiceName, Description, StandardCost, CreatedAt, UpdatedAt
  FROM dbo.ServiceCatalog
`;

async function getAll() {
  const pool = await poolPromise;
  const rs = await pool.request().query(`${SELECT_BASE} ORDER BY ServiceID`);
  return rs.recordset;
}

async function getById(id) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('id', sql.Int, id)
    .query(`${SELECT_BASE} WHERE ServiceID = @id`);
  return rs.recordset[0] || null;
}

async function create({ ServiceName, Description = null, StandardCost }) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('ServiceName', sql.NVarChar(100), ServiceName)
    .input('Description', sql.NVarChar(255), Description)
    .input('StandardCost', sql.Decimal(18, 2), Number(StandardCost))
    .query(`
      INSERT INTO dbo.ServiceCatalog (ServiceName, Description, StandardCost)
      OUTPUT INSERTED.ServiceID, INSERTED.ServiceName, INSERTED.Description,
             INSERTED.StandardCost, INSERTED.CreatedAt, INSERTED.UpdatedAt
      VALUES (@ServiceName, @Description, @StandardCost)
    `);
  return rs.recordset[0];
}

async function update(id, { ServiceName = null, Description = null, StandardCost = null }) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('id', sql.Int, id)
    .input('ServiceName', sql.NVarChar(100), ServiceName)
    .input('Description', sql.NVarChar(255), Description)
    .input(
      'StandardCost',
      sql.Decimal(18, 2),
      StandardCost === null ? null : Number(StandardCost)
    )
    .query(`
      UPDATE dbo.ServiceCatalog
      SET
        ServiceName  = COALESCE(@ServiceName, ServiceName),
        Description  = COALESCE(@Description, Description),
        StandardCost = COALESCE(@StandardCost, StandardCost),
        UpdatedAt    = SYSUTCDATETIME()
      WHERE ServiceID = @id;

      ${SELECT_BASE} WHERE ServiceID = @id;
    `);
  return rs.recordset[0] || null;
}

async function remove(id) {
  const pool = await poolPromise;
  const rs = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM dbo.ServiceCatalog WHERE ServiceID = @id;
      SELECT @@ROWCOUNT AS affected;
    `);
  return (rs.recordset[0]?.affected || 0) > 0;
}

module.exports = { getAll, getById, create, update, remove };
