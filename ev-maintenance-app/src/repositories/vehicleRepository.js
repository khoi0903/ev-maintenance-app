const pool = require("../db");

class VehicleRepository {
  async createVehicle({ accountId, modelId, vin, licensePlate, year }) {
    const result = await pool
      .request()
      .input("accountId", accountId)
      .input("modelId", modelId)
      .input("vin", vin)
      .input("licensePlate", licensePlate)
      .input("year", year)
      .query(`
        INSERT INTO Vehicle (AccountID, ModelID, VIN, LicensePlate, Year)
        OUTPUT INSERTED.*
        VALUES (@accountId, @modelId, @vin, @licensePlate, @year)
      `);
    return result.recordset[0];
  }

  async getVehiclesByAccountId(accountId) {
    const result = await pool
      .request()
      .input("accountId", accountId)
      .query("SELECT * FROM Vehicle WHERE AccountID = @accountId AND Status = 'Active'");
    return result.recordset;
  }

  async updateVehicle(id, { modelId, vin, licensePlate, year }) {
    await pool
      .request()
      .input("id", id)
      .input("modelId", modelId)
      .input("vin", vin)
      .input("licensePlate", licensePlate)
      .input("year", year)
      .input("updatedAt", new Date())
      .query(`
        UPDATE Vehicle
        SET ModelID = @modelId,
            VIN = @vin,
            LicensePlate = @licensePlate,
            Year = @year,
            UpdatedAt = @updatedAt
        WHERE VehicleID = @id
      `);
  }

  async deactivateVehicle(id) {
    await pool
      .request()
      .input("id", id)
      .input("updatedAt", new Date())
      .query(`
        UPDATE Vehicle
        SET Status = 'Inactive',
            UpdatedAt = @updatedAt
        WHERE VehicleID = @id
      `);
  }
}

module.exports = new VehicleRepository();
