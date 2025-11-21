// src/repositories/inventoryRepository.js
const { sql, poolPromise } = require('../db')

// SELECT dùng chung để tránh lặp lại
const SELECT_BASE = `
  SELECT
    p.PartID,
    p.PartName,
    p.ModelID,
    m.Brand,
    m.ModelName,
    p.StockQuantity,
    p.MinStock,
    p.UnitPrice,
    p.CreatedAt,
    p.UpdatedAt
  FROM dbo.PartInventory p
  JOIN dbo.Model m ON p.ModelID = m.ModelID
`

// Lấy toàn bộ inventory
async function getAllInventory() {
  const pool = await poolPromise
  const rs = await pool
    .request()
    .query(`${SELECT_BASE} ORDER BY p.PartName, p.PartID`)
  return rs.recordset || []
}

// Lấy danh sách sắp hết (StockQuantity <= MinStock)
async function getLowStockInventory() {
  const pool = await poolPromise
  const rs = await pool
    .request()
    .query(`
      ${SELECT_BASE}
      WHERE p.StockQuantity <= p.MinStock
      ORDER BY p.StockQuantity ASC, p.PartName
    `)
  return rs.recordset || []
}

// Lấy một Part theo ID
async function getPartById(partId) {
  const pool = await poolPromise
  const rs = await pool
    .request()
    .input('PartID', sql.Int, partId)
    .query(`${SELECT_BASE} WHERE p.PartID = @PartID`)
  return rs.recordset[0] || null
}

// Cập nhật thông tin Part
async function updatePart(partId, data) {
  const pool = await poolPromise
  const req = pool.request().input('PartID', sql.Int, partId)

  const updates = []
  if (data.PartName !== undefined) {
    req.input('PartName', sql.NVarChar(100), data.PartName)
    updates.push('PartName = @PartName')
  }
  if (data.ModelID !== undefined) {
    req.input('ModelID', sql.Int, data.ModelID)
    updates.push('ModelID = @ModelID')
  }
  if (data.StockQuantity !== undefined) {
    req.input('StockQuantity', sql.Int, data.StockQuantity)
    updates.push('StockQuantity = @StockQuantity')
  }
  if (data.UnitPrice !== undefined) {
    req.input('UnitPrice', sql.Decimal(18,2), data.UnitPrice)
    updates.push('UnitPrice = @UnitPrice')
  }
  if (data.MinStock !== undefined) {
    req.input('MinStock', sql.Int, data.MinStock)
    updates.push('MinStock = @MinStock')
  }
  if (data.WarrantyMonths !== undefined) {
    req.input('WarrantyMonths', sql.Int, data.WarrantyMonths)
    updates.push('WarrantyMonths = @WarrantyMonths')
  }

  if (updates.length === 0) {
    return getPartById(partId)
  }

  const q = `
    UPDATE dbo.PartInventory
    SET ${updates.join(', ')}, UpdatedAt = SYSDATETIME()
    WHERE PartID = @PartID;

    ${SELECT_BASE} WHERE p.PartID = @PartID;
  `

  const rs = await req.query(q)
  return rs.recordset[0] || null
}

// Xóa Part (nếu chưa có PartUsage tham chiếu)
async function deletePart(partId) {
  const pool = await poolPromise
  const req = pool.request().input('PartID', sql.Int, partId)

  // Kiểm tra tham chiếu
  const usageCheck = await req.query(`
    SELECT TOP 1 1 FROM dbo.PartUsage WHERE PartID = @PartID
  `)
  if (usageCheck.recordset.length > 0) {
    throw new Error('Không thể xóa phụ tùng: đang được sử dụng trong WorkOrder')
  }

  const delRs = await req.query(`
    DELETE FROM dbo.PartInventory WHERE PartID = @PartID;
  `)

  return { success: true }
}

module.exports = {
  getAllInventory,
  getLowStockInventory,
}
