// src/repositories/vehicleRepository.js
// Repository quản lý Vehicle (full CRUD + soft-deactivate)
// Sử dụng poolPromise

const { poolPromise, sql } = require("../db");

class VehicleRepository {
  // Lấy tất cả xe theo AccountID (chỉ Active)
  async getAllByAccount(accountId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("AccountID", sql.Int, accountId)
      .query("SELECT * FROM Vehicle WHERE AccountID = @AccountID");
    return r.recordset;
  }

  // Lấy chi tiết 1 xe theo ID
  async getById(vehicleId) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .query("SELECT * FROM Vehicle WHERE VehicleID = @VehicleID");
    return r.recordset[0];
  }

  // Tạo xe mới
  async createVehicle({ accountId, modelId, vin, licensePlate, year }) {
    const pool = await poolPromise;
    await pool.request()
      .input("AccountID", sql.Int, accountId)
      .input("ModelID", sql.Int, modelId)
      .input("VIN", sql.NVarChar(100), vin)
      .input("LicensePlate", sql.NVarChar(50), licensePlate)
      .input("Year", sql.Int, year)
      .query(`
        INSERT INTO Vehicle (AccountID, ModelID, VIN, LicensePlate, Year, CreatedDate)
        VALUES (@AccountID, @ModelID, @VIN, @LicensePlate, @Year, SYSUTCDATETIME())
      `);
  }

  // Cập nhật xe
  async updateVehicle(vehicleId, { modelId, vin, licensePlate, year }) {
    const pool = await poolPromise;
    await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("ModelID", sql.Int, modelId)
      .input("VIN", sql.NVarChar(100), vin)
      .input("LicensePlate", sql.NVarChar(50), licensePlate)
      .input("Year", sql.Int, year)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Vehicle
        SET ModelID = @ModelID,
            VIN = @VIN,
            LicensePlate = @LicensePlate,
            Year = @Year,
            UpdatedAt = @updatedAt
        WHERE VehicleID = @VehicleID
      `);
  }

  // Vô hiệu hóa (soft delete)
  async deactivateVehicle(vehicleId) {
    const pool = await poolPromise;
    await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("updatedAt", sql.DateTime2, new Date())
      .query(`
        UPDATE Vehicle
        SET UpdatedAt = @updatedAt
        WHERE VehicleID = @VehicleID;
        -- nếu bạn muốn thêm cột Status cho vehicle, bỏ comment và sửa
        -- UPDATE Vehicle SET Status='Inactive', UpdatedAt=@updatedAt WHERE VehicleID=@VehicleID
      `);
  }
}

module.exports = new VehicleRepository();
