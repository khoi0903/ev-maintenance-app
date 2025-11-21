// src/db.js
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: (process.env.DB_ENCRYPT || 'false') === 'true',
    trustServerCertificate: (process.env.DB_TRUST_CERT || 'true') === 'true',
  },
};

async function ensureWorkOrderStatusConstraint(pool) {
  try {
    const checkResult = await pool.request().query(`
      SELECT TOP 1 cc.name AS ConstraintName, cc.definition
      FROM sys.check_constraints cc
      INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
      WHERE t.name = 'WorkOrder'
        AND cc.definition LIKE '%ProgressStatus%'
      ORDER BY cc.name
    `);

    if (!checkResult.recordset.length) {
      console.warn('[DB] No WorkOrder ProgressStatus constraint found.');
      return;
    }

    const { ConstraintName, definition } = checkResult.recordset[0];
    if (definition && definition.includes('Done')) {
      return; // already up-to-date
    }

    console.log(`[DB] Updating constraint ${ConstraintName} to allow Done status.`);
    await pool.request().query(`ALTER TABLE WorkOrder DROP CONSTRAINT [${ConstraintName}]`);
    await pool.request().query(`
      ALTER TABLE WorkOrder ADD CONSTRAINT [${ConstraintName}]
        CHECK (ProgressStatus IN ('Pending','InProgress','OnHold','Done'))
    `);
    console.log('[DB] WorkOrder constraint updated successfully.');
  } catch (err) {
    console.error('[DB] Failed to ensure WorkOrder constraint:', err.message);
  }
}

async function ensureInvoiceConstraint(pool) {
  try {
    const result = await pool.request().query(`
      SELECT TOP 1 cc.name AS ConstraintName, cc.definition
      FROM sys.check_constraints cc
      INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
      WHERE t.name = 'Invoice'
        AND cc.name LIKE '%Invoice%'
      ORDER BY cc.name
    `);

    if (!result.recordset.length) {
      console.warn('[DB] No Invoice constraint found.');
      return;
    }

    const { ConstraintName, definition } = result.recordset[0];
    if (definition && definition.includes('AppointmentID IS NOT NULL OR WorkOrderID IS NOT NULL')) {
      return;
    }

    console.log(`[DB] Updating invoice constraint ${ConstraintName} to allow both AppointmentID and WorkOrderID.`);
    await pool.request().query(`ALTER TABLE Invoice DROP CONSTRAINT [${ConstraintName}]`);
    await pool.request().query(`
      ALTER TABLE Invoice ADD CONSTRAINT [${ConstraintName}]
        CHECK (AppointmentID IS NOT NULL OR WorkOrderID IS NOT NULL)
    `);
    console.log('[DB] Invoice constraint updated successfully.');
  } catch (err) {
    console.error('[DB] Failed to ensure Invoice constraint:', err.message);
  }
}

async function ensureInvoiceSentColumns(pool) {
  try {
    const hasSentColumn = await pool.request().query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Invoice' AND COLUMN_NAME = 'SentToCustomerAt'
    `);

    if (!hasSentColumn.recordset.length) {
      console.log('[DB] Adding Invoice.SentToCustomerAt column');
      await pool.request().query(`ALTER TABLE Invoice ADD SentToCustomerAt DATETIME2 NULL`);
    }

    const hasStaffColumn = await pool.request().query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Invoice' AND COLUMN_NAME = 'SentByStaffID'
    `);

    if (!hasStaffColumn.recordset.length) {
      console.log('[DB] Adding Invoice.SentByStaffID column');
      await pool.request().query(`ALTER TABLE Invoice ADD SentByStaffID INT NULL`);
    }
  } catch (err) {
    console.error('[DB] Failed to ensure Invoice sent columns:', err.message);
  }
}

async function ensureInvoiceCustomerPaidColumn(pool) {
  try {
    const res = await pool.request().query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Invoice' AND COLUMN_NAME = 'CustomerPaidAt'
    `);
    if (!res.recordset.length) {
      console.log('[DB] Adding Invoice.CustomerPaidAt column');
      await pool.request().query(`ALTER TABLE Invoice ADD CustomerPaidAt DATETIME2 NULL`);
    }
  } catch (err) {
    console.error('[DB] Failed to ensure Invoice.CustomerPaidAt column:', err.message);
  }
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(async pool => {
    console.log('✅ SQL connected:', { server: config.server, database: config.database });
    await ensureWorkOrderStatusConstraint(pool);
    await ensureInvoiceConstraint(pool);
    await ensureInvoiceSentColumns(pool);
    await ensureInvoiceCustomerPaidColumn(pool);
    return pool;
  })
  .catch(err => {
    console.error('❌ SQL connect error:', err.message);
    throw err; // QUAN TRỌNG: ném lỗi để ai await cũng thấy lỗi
  });

module.exports = { sql, poolPromise };
