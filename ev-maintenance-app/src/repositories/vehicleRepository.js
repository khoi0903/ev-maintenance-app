const { sql, poolPromise } = require("../db");

class VehicleRepository {
  async createVehicle({ accountId, modelId, vin, licensePlate, year }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("accountId", sql.Int, accountId)
      .input("modelId", sql.Int, modelId)
      .input("vin", sql.NVarChar, vin)
      .input("licensePlate", sql.NVarChar, licensePlate)
      .input("year", sql.Int, year)
      .query(`
        INSERT INTO Vehicle (AccountID, ModelID, VIN, LicensePlate, Year)
        OUTPUT INSERTED.*
        VALUES (@accountId, @modelId, @vin, @licensePlate, @year)
      `);
    return result.recordset[0];
  }

  async getById(vehicleId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("vehicleId", sql.Int, vehicleId)
      .query(`SELECT * FROM Vehicle WHERE VehicleID = @vehicleId`);
    return result.recordset[0];
  }

  async getVehiclesByAccount(accountId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("accountId", sql.Int, accountId)
      .query(`SELECT * FROM Vehicle WHERE AccountID = @accountId AND Status = 'Active'`);
    return result.recordset;
  }

  async updateVehicle(vehicleId, { modelId, licensePlate, year }) {
    const pool = await poolPromise;
    await pool.request()
      .input("vehicleId", sql.Int, vehicleId)
      .input("modelId", sql.Int, modelId)
      .input("licensePlate", sql.NVarChar, licensePlate)
      .input("year", sql.Int, year)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Vehicle
        SET ModelID = @modelId,
            LicensePlate = @licensePlate,
            Year = @year,
            UpdatedAt = @updatedAt
        WHERE VehicleID = @vehicleId
      `);
  }

  async deactivateVehicle(vehicleId) {
    const pool = await poolPromise;
    await pool.request()
      .input("vehicleId", sql.Int, vehicleId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Vehicle
        SET Status = 'Inactive',
            UpdatedAt = @updatedAt
        WHERE VehicleID = @vehicleId
      `);
  }
}

module.exports = new VehicleRepository();
