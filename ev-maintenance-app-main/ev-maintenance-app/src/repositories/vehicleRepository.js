// repositories/vehicleRepository.js
const { poolPromise, sql } = require("../db");

/**
 * Vehicle(VehicleID, AccountID, ModelID, VIN NVARCHAR(100) UNIQUE, LicensePlate NVARCHAR(50) UNIQUE, Year INT NULL, Color, Notes, CreatedAt, UpdatedAt)
 * Model(ModelID, Brand, ModelName, ...)
 */
class VehicleRepository {
  // ===== Lookups needed by appointment flow =====
  async getByVIN(vin) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("VIN", sql.NVarChar(100), vin)
      .query(`
        SELECT v.*, m.Brand, m.ModelName
        FROM Vehicle v
        LEFT JOIN Model m ON m.ModelID = v.ModelID
        WHERE v.VIN = @VIN
      `);
    return r.recordset[0] || null;
  }

  async getByLicense(plate) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("LicensePlate", sql.NVarChar(50), plate)
      .query(`
        SELECT v.*, m.Brand, m.ModelName
        FROM Vehicle v
        LEFT JOIN Model m ON m.ModelID = v.ModelID
        WHERE v.LicensePlate = @LicensePlate
      `);
    return r.recordset[0] || null;
  }

  // ===== CRUD =====
  async findAll({ accountId } = {}) {
    const pool = await poolPromise;
    const req = pool.request();
    let where = "";
    if (accountId) {
      req.input("AccountID", sql.Int, accountId);
      where = "WHERE v.AccountID = @AccountID";
    }
    const r = await req.query(`
      SELECT
        v.VehicleID, v.AccountID, v.ModelID,
        v.VIN, v.LicensePlate, v.Year, v.Color, v.Notes,
        v.CreatedAt, v.UpdatedAt,
        m.Brand, m.ModelName,
        acc.FullName AS OwnerName,
        acc.Phone    AS OwnerPhone,
        acc.Email    AS OwnerEmail
      FROM Vehicle v
      LEFT JOIN Model m ON m.ModelID = v.ModelID
      LEFT JOIN Account acc ON acc.AccountID = v.AccountID
      ${where}
      ORDER BY v.VehicleID DESC
    `);
    return r.recordset;
  }

  async findById(id) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("VehicleID", sql.Int, id)
      .query(`
        SELECT
          v.VehicleID, v.AccountID, v.ModelID,
          v.VIN, v.LicensePlate, v.Year, v.Color, v.Notes,
          v.CreatedAt, v.UpdatedAt,
          m.Brand, m.ModelName,
          acc.FullName AS OwnerName,
          acc.Phone    AS OwnerPhone,
          acc.Email    AS OwnerEmail
        FROM Vehicle v
        LEFT JOIN Model m ON m.ModelID = v.ModelID
        LEFT JOIN Account acc ON acc.AccountID = v.AccountID
        WHERE v.VehicleID = @VehicleID
      `);
    return r.recordset[0] || null;
  }

  async create({ AccountID, ModelID, VIN, LicensePlate, Year = null, Color = null, Notes = null }) {
    const pool = await poolPromise;
    const req = pool.request()
      .input("AccountID", sql.Int, AccountID)
      .input("ModelID", sql.Int, ModelID)
      .input("VIN", sql.NVarChar(100), VIN)
      .input("LicensePlate", sql.NVarChar(50), LicensePlate)
      .input("Year", sql.Int, Year)                 // cho phép null
      .input("Color", sql.NVarChar(50), Color)
      .input("Notes", sql.NVarChar(sql.MAX), Notes);

    const r = await req.query(`
      INSERT INTO Vehicle (AccountID, ModelID, VIN, LicensePlate, Year, Color, Notes, CreatedAt)
      VALUES (@AccountID, @ModelID, @VIN, @LicensePlate, @Year, @Color, @Notes, SYSUTCDATETIME());
      SELECT SCOPE_IDENTITY() AS NewId;
    `);
    const newId = r.recordset[0].NewId;
    return this.findById(newId);
  }

  async update(id, { ModelID, VIN, LicensePlate, Year = null, Color = null, Notes = null }) {
    const pool = await poolPromise;
    const req = pool.request()
      .input("VehicleID", sql.Int, id)
      .input("ModelID", sql.Int, ModelID)
      .input("VIN", sql.NVarChar(100), VIN)
      .input("LicensePlate", sql.NVarChar(50), LicensePlate)
      .input("Year", sql.Int, Year)
      .input("Color", sql.NVarChar(50), Color)
      .input("Notes", sql.NVarChar(sql.MAX), Notes);

    const r = await req.query(`
      UPDATE Vehicle
         SET ModelID = @ModelID,
             VIN = @VIN,
             LicensePlate = @LicensePlate,
             Year = @Year,
             Color = @Color,
             Notes = @Notes,
             UpdatedAt = SYSUTCDATETIME()
       WHERE VehicleID = @VehicleID;

      SELECT @@ROWCOUNT AS Affected;
    `);
    if (!r.recordset[0].Affected) return null;
    return this.findById(id);
  }

  async remove(id) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("VehicleID", sql.Int, id)
      .query(`DELETE FROM Vehicle WHERE VehicleID = @VehicleID; SELECT @@ROWCOUNT AS Affected;`);
    return !!r.recordset[0].Affected;
  }
  // thêm vào class VehicleRepository
async getByVIN(vin) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("VIN", sql.VarChar(50), vin);
  const r = await req.query(`
    SELECT v.*, m.Brand, m.ModelName
    FROM Vehicle v
    LEFT JOIN Model m ON m.ModelID = v.ModelID
    WHERE v.VIN = @VIN
  `);
  return r.recordset[0] || null;
}

async getByLicense(plate) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("LicensePlate", sql.VarChar(20), plate);
  const r = await req.query(`
    SELECT v.*, m.Brand, m.ModelName
    FROM Vehicle v
    LEFT JOIN Model m ON m.ModelID = v.ModelID
    WHERE v.LicensePlate = @LicensePlate
  `);
  return r.recordset[0] || null;
}

}

module.exports = new VehicleRepository();
