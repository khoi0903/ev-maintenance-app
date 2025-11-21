// src/controllers/inventoryController.js
const svc = require('../services/inventoryService')

const ok = (res, data, code = 200) =>
  res.status(code).json({ success: true, data })

const fail = (res, err) => {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Server error'
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
}

// GET /admin/inventory
exports.listInventory = async (_req, res) => {
  try {
    const rows = await svc.listInventory()
    return ok(res, rows)
  } catch (err) {
    console.error('[inventory/listInventory]', err)
    return fail(res, err)
  }
}

// GET /admin/inventory/low-stock
exports.listLowStockInventory = async (_req, res) => {
  try {
    const rows = await svc.listLowStockInventory()
    return ok(res, rows)
  } catch (err) {
    console.error('[inventory/listLowStockInventory]', err)
    return fail(res, err)
  }
}

// POST /admin/inventory
exports.createInventory = async (req, res) => {
  try {
    const data = req.body
    const result = await svc.createPart(data)
    return ok(res, result, 201)
  } catch (err) {
    console.error('[inventory/createInventory]', err)
    return fail(res, err)
  }
}

// PUT /admin/inventory/:partId
exports.updateInventory = async (req, res) => {
  try {
    const partId = parseInt(req.params.partId, 10)
    const data = req.body
    const result = await svc.updatePart(partId, data)
    return ok(res, result)
  } catch (err) {
    console.error('[inventory/updateInventory]', err)
    return fail(res, err)
  }
}

// DELETE /admin/inventory/:partId
exports.deleteInventory = async (req, res) => {
  try {
    const partId = parseInt(req.params.partId, 10)
    const result = await svc.deletePart(partId)
    return ok(res, result)
  } catch (err) {
    console.error('[inventory/deleteInventory]', err)
    return fail(res, err)
  }
}
