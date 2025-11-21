// src/controllers/workOrderController.js
const service = require("../services/workOrderService")

function getAccountIdFromReq(req) {
  return (
    req.user?.AccountID ||
    req.user?.accountId ||
    req.user?.id ||
    null
  )
}

// ===== CUSTOMER: /workorders/my/* =====

// GET /workorders/my/active
exports.getMyActive = async (req, res) => {
  try {
    const accountId = getAccountIdFromReq(req)
    if (!accountId) {
      return res
        .status(401)
        .json({ success: false, message: "Không xác định được tài khoản" })
    }
    const data = await service.getMyActive(accountId)
    res.json({ success: true, data })
  } catch (err) {
    console.error("[workorders/my/active]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// GET /workorders/my/completed
exports.getMyCompleted = async (req, res) => {
  try {
    const accountId = getAccountIdFromReq(req)
    if (!accountId) {
      return res
        .status(401)
        .json({ success: false, message: "Không xác định được tài khoản" })
    }
    const data = await service.getMyCompleted(accountId)
    res.json({ success: true, data })
  } catch (err) {
    console.error("[workorders/my/completed]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// GET /workorders/my/:id
exports.getMyWorkOrder = async (req, res) => {
  try {
    const accountId = getAccountIdFromReq(req)
    const id = Number(req.params.id)
    if (!accountId) {
      return res
        .status(401)
        .json({ success: false, message: "Không xác định được tài khoản" })
    }
    const data = await service.getMyDetail(id, accountId)
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy work order" })
    }
    res.json({ success: true, data })
  } catch (err) {
    console.error("[workorders/my/:id]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// ===== TECHNICIAN actions on my work orders =====

// POST /workorders/my/:id/start
exports.startMyWork = async (req, res) => {
  try {
    const technicianId = getAccountIdFromReq(req)
    const id = Number(req.params.id)
    const updated = await service.startMyWork(id, technicianId)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error("[workorders/my/:id/start]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// POST /workorders/my/:id/complete
exports.completeMyWork = async (req, res) => {
  try {
    const technicianId = getAccountIdFromReq(req)
    const id = Number(req.params.id)
    const updated = await service.completeMyWork(id, technicianId)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error("[workorders/my/:id/complete]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// PATCH /workorders/my/:id/diagnosis
exports.updateMyDiagnosis = async (req, res) => {
  try {
    const technicianId = getAccountIdFromReq(req)
    const id = Number(req.params.id)
    const { diagnosis } = req.body
    const updated = await service.updateMyDiagnosis(id, technicianId, diagnosis)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error("[workorders/my/:id/diagnosis]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// POST /workorders/my/:id/parts
exports.addPartForMyWork = async (req, res) => {
  try {
    const technicianId = getAccountIdFromReq(req)
    const id = Number(req.params.id)
    const created = await service.addPartUsageForMyWork(id, technicianId, req.body)
    res.json({ success: true, data: created })
  } catch (err) {
    console.error("[workorders/my/:id/parts]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// DELETE /workorders/my/parts/:usageId
exports.deleteMyPartUsage = async (req, res) => {
  try {
    const technicianId = getAccountIdFromReq(req)
    const usageId = Number(req.params.usageId)
    if (!technicianId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản' })
    await service.deletePartUsageForMyWork(usageId, technicianId)
    res.json({ success: true })
  } catch (err) {
    console.error('[workorders/my/parts/:usageId DELETE]', err)
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message })
  }
}

// DELETE /workorders/parts/:usageId (Staff/Admin)
exports.deletePartUsage = async (req, res) => {
  try {
    const usageId = Number(req.params.usageId)
    await service.deletePartUsage(usageId)
    res.json({ success: true })
  } catch (err) {
    console.error('[workorders/parts/:usageId DELETE]', err)
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message })
  }
}

// ===== STAFF / ADMIN =====

// GET /workorders
exports.listAll = async (req, res) => {
  try {
    const data = await service.listAll()
    res.json({ success: true, data })
  } catch (err) {
    console.error("[workorders/list]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// GET /workorders/:id
exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const data = await service.getOne(id)
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy work order" })
    }
    res.json({ success: true, data })
  } catch (err) {
    console.error("[workorders/:id]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// POST /workorders
exports.create = async (req, res) => {
  try {
    const created = await service.create(req.body)
    res.status(201).json({ success: true, data: created })
  } catch (err) {
    console.error("[workorders/create]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// POST /workorders/:id/details
exports.addServiceDetail = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const created = await service.addServiceDetail(id, req.body)
    res.json({ success: true, data: created })
  } catch (err) {
    console.error("[workorders/:id/details]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// DELETE /workorders/details/:detailId
exports.deleteServiceDetail = async (req, res) => {
  try {
    const detailId = Number(req.params.detailId)
    await service.deleteServiceDetail(detailId)
    res.json({ success: true })
  } catch (err) {
    console.error("[workorders/details/:detailId]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// POST /workorders/:id/parts
exports.addPartUsage = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const created = await service.addPartUsage(id, req.body)
    res.json({ success: true, data: created })
  } catch (err) {
    console.error("[workorders/:id/parts]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}

// PATCH /workorders/:id
exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const updated = await service.update(id, req.body)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error("[workorders/update]", err)
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message })
  }
}