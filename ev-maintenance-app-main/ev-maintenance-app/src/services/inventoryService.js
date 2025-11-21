// src/services/inventoryService.js
const repo = require('../repositories/inventoryRepository')
const { sql, poolPromise } = require('../db')

/**
 * Trả về toàn bộ danh sách phụ tùng trong kho.
 */
async function listInventory() {
  return await repo.getAllInventory()
}

async function updatePart(partId, data) {
  // Delegate to repository which handles partial updates
  return await repo.updatePart(partId, data)
}

async function deletePart(partId) {
  // Delegate to repository which checks references before deleting
  return await repo.deletePart(partId)
}

/**
 * Trả về danh sách phụ tùng có tồn kho thấp (<= MinStock).
 */
async function listLowStockInventory() {
  return await repo.getLowStockInventory()
}
const createPart = async (data) => {
  const {
    partName,
    modelId,
    stockQuantity = 0,
    unitPrice,
    minStock = 0,
    warrantyMonths = null,
  } = data

  const pool = await poolPromise
  const tx = new sql.Transaction(pool)

  try {
    await tx.begin()

    const request = new sql.Request(tx)

    // INSERT PartInventory, lấy PartID mới bằng OUTPUT
    const insertResult = await request
      .input('PartName', sql.NVarChar(100), partName)
      .input('ModelID', sql.Int, modelId)
      .input('StockQuantity', sql.Int, stockQuantity)
      .input('UnitPrice', sql.Decimal(18, 2), unitPrice)
      .input('MinStock', sql.Int, minStock)
      .input('WarrantyMonths', sql.Int, warrantyMonths)
      .query(`
        INSERT INTO dbo.PartInventory
          (PartName, ModelID, StockQuantity, UnitPrice, MinStock, WarrantyMonths)
        OUTPUT INSERTED.PartID
        VALUES (@PartName, @ModelID, @StockQuantity, @UnitPrice, @MinStock, @WarrantyMonths);
      `)

    const newPartId = insertResult.recordset[0].PartID

    // Query lại để trả về đầy đủ thông tin + Brand/ModelName
    const getResult = await new sql.Request(tx)
      .input('PartID', sql.Int, newPartId)
      .query(`
        SELECT
          p.PartID,
          p.PartName,
          p.ModelID,
          m.Brand,
          m.ModelName,
          p.StockQuantity,
          p.UnitPrice,
          p.MinStock,
          p.WarrantyMonths,
          p.CreatedAt,
          p.UpdatedAt
        FROM dbo.PartInventory p
        JOIN dbo.Model m ON p.ModelID = m.ModelID
        WHERE p.PartID = @PartID
      `)

    await tx.commit()
    return getResult.recordset[0]
  } catch (err) {
    await tx.rollback()
    throw err
  }
}
module.exports = {
  listInventory,
  listLowStockInventory,
  createPart,
  updatePart,
  deletePart,
}
