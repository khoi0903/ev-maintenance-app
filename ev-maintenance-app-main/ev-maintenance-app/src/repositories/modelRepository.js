const { poolPromise, sql } = require("../db");

class ModelRepository {
  async getAll() {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT ModelID, Brand, ModelName, EngineSpec, CreatedAt
      FROM Model
      ORDER BY Brand, ModelName
    `);
    return r.recordset;
  }
  
  async getById(id) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT ModelID, Brand, ModelName, EngineSpec, CreatedAt, UpdatedAt
        FROM Model WHERE ModelID = @id
      `);
    return rs.recordset[0];
  }

  async findByBrandAndName(brand, modelName) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('Brand', sql.NVarChar(100), brand)
      .input('ModelName', sql.NVarChar(100), modelName)
      .query(`
        SELECT TOP 1 ModelID, Brand, ModelName
        FROM Model
        WHERE Brand = @Brand AND ModelName = @ModelName
      `);
    return rs.recordset[0] || null;
  }

  async create({ brand, modelName, engineSpec = null }) {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('Brand', sql.NVarChar(100), brand)
      .input('ModelName', sql.NVarChar(100), modelName)
      .input('EngineSpec', sql.NVarChar(200), engineSpec)
      .query(`
        DECLARE @New TABLE(ModelID INT);
        INSERT INTO Model (Brand, ModelName, EngineSpec, CreatedAt)
        OUTPUT INSERTED.ModelID INTO @New
        VALUES (@Brand, @ModelName, @EngineSpec, SYSUTCDATETIME());

        SELECT m.ModelID, m.Brand, m.ModelName
        FROM Model m
        JOIN @New n ON m.ModelID = n.ModelID;
      `);
    return rs.recordset[0];
  }
}
module.exports = new ModelRepository();
