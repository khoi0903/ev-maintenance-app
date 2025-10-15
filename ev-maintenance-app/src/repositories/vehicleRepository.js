// src/repositories/vehicleRepository.js (patched for partial update + VIN rules)
const { poolPromise, sql } = require("../db");

class VehicleRepository {
  async getAllByAccount(accountId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AccountID", sql.Int, accountId)
      .query("SELECT * FROM Vehicle WHERE AccountID = @AccountID");
    return r.recordset;
  }

  async getById(vehicleId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .query("SELECT * FROM Vehicle WHERE VehicleID = @VehicleID");
    return r.recordset[0];
  }

  async createVehicle({ accountId, modelId, vin, licensePlate, year }) {
    const pool = await poolPromise;
    await pool.request()
      .input("AccountID", sql.Int, accountId)
      .input("ModelID", sql.Int, modelId)
      .input("VIN", sql.NVarChar(100), vin)
      .input("LicensePlate", sql.NVarChar(50), licensePlate)
      .input("Year", sql.Int, year)
      .query(`
        INSERT INTO Vehicle (AccountID, ModelID, VIN, LicensePlate, Year, CreatedAt)
        VALUES (@AccountID, @ModelID, @VIN, @LicensePlate, @Year, SYSUTCDATETIME())
      `);
  }

  // ✅ Partial update
  async updateVehicle(vehicleId, data) {
    const pool = await poolPromise;
    const req = pool.request().input("VehicleID", sql.Int, vehicleId);
    const fields = [];

    const current = await this.getById(vehicleId);
    if (!current) throw new Error("Không tìm thấy xe để cập nhật");

    if (data.modelId !== undefined) {
      req.input("ModelID", sql.Int, data.modelId);
      fields.push("ModelID = @ModelID");
    }
    if (data.vin !== undefined) {
      if (data.vin != current.VIN) {
        const check = await pool.request()
          .input("VIN", sql.NVarChar(100), data.vin)
          .input("VehicleID", sql.Int, vehicleId)
          .query("SELECT 1 FROM Vehicle WHERE VIN = @VIN AND VehicleID <> @VehicleID");
        if (check.recordset.length) throw new Error("VIN này đã tồn tại trên hệ thống");
      }
      req.input("VIN", sql.NVarChar(100), data.vin);
      fields.push("VIN = @VIN");
    }
    if (data.licensePlate !== undefined) {
      req.input("LicensePlate", sql.NVarChar(50), data.licensePlate);
      fields.push("LicensePlate = @LicensePlate");
    }
    if (data.year !== undefined) {
      req.input("Year", sql.Int, data.year);
      fields.push("Year = @Year");
    }

    if (!fields.length) return;
    req.input("updatedAt", sql.DateTime2, new Date());
    fields.push("UpdatedAt = @updatedAt");

    const q = `UPDATE Vehicle SET ${fields.join(", ")} WHERE VehicleID = @VehicleID`;
    await req.query(q);
  }

  async deactivateVehicle(vehicleId) {
    const pool = await poolPromise;
    await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Vehicle
        SET UpdatedAt = @updatedAt
        WHERE VehicleID = @VehicleID;
      `);
  }

  async deleteVehicle(vehicleId) {
    return this.deactivateVehicle(vehicleId);
  }
}

module.exports = new VehicleRepository();
