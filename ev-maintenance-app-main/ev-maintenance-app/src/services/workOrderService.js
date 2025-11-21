// src/services/workOrderService.js
const repo = require("../repositories/workOrderRepository")

// ===== CUSTOMER: My work orders (Progress page + detail) =====

async function getMyActive(accountId) {
  return await repo.getMyActiveWorkOrders(accountId)
}

async function getMyCompleted(accountId) {
  return await repo.getMyCompletedWorkOrders(accountId)
}

async function getMyDetail(workOrderId, accountId) {
  return await repo.getMyWorkOrderDetail(workOrderId, accountId)
}

// ===== STAFF / ADMIN =====

async function listAll(query = {}) {
  // nếu sau này cần filter theo query, truyền thêm vào repo
  return await repo.listAllWorkOrders(query)
}

async function getOne(id) {
  return await repo.getWorkOrderById(id)
}

async function create(data) {
  // data có thể là { AppointmentID, TechnicianID, StartTime, ... }
  return await repo.createWorkOrder(data)
}

async function addServiceDetail(workOrderId, payload) {
  // FE có thể gửi serviceId / quantity / unitPrice (camelCase)
  const serviceId =
    payload.serviceId ?? payload.ServiceID ?? null
  const quantity =
    payload.quantity ?? payload.Quantity ?? 1
  let unitPrice =
    payload.unitPrice ?? payload.UnitPrice ?? null

  return await repo.addServiceDetail(workOrderId, serviceId, quantity, unitPrice)
}


async function deleteServiceDetail(detailId) {
  return await repo.deleteServiceDetail(detailId)
}

async function addPartUsage(workOrderId, payload) {
  const { partId, quantity, unitPrice } = payload
  return await repo.addPartUsage(workOrderId, partId, quantity, unitPrice)
}

async function update(id, data) {
  return await repo.updateWorkOrder(id, data)
}


// ===== TECHNICIAN: thao tác trên work order của chính mình =====

// Bắt đầu công việc
async function startMyWork(workOrderId, technicianId) {
  const now = new Date()
  return await repo.updateWorkOrder(workOrderId, {
    TechnicianID: technicianId,
    StartTime: now,
    ProgressStatus: "InProgress",
  })
}

// Hoàn thành công việc
async function completeMyWork(workOrderId, technicianId) {
  const now = new Date()
  return await repo.updateWorkOrder(workOrderId, {
    TechnicianID: technicianId,
    EndTime: now,
    ProgressStatus: "Done", 
  })
}

// Cập nhật chẩn đoán
async function updateMyDiagnosis(workOrderId, technicianId, diagnosis) {
  return await repo.updateWorkOrder(workOrderId, {
    TechnicianID: technicianId,
    Diagnosis: diagnosis,
  })
}

// Thêm phụ tùng cho work order của mình
async function addPartUsageForMyWork(workOrderId, technicianId, payload) {
  const { partId, quantity, unitPrice } = payload
  // hiện tại chưa lưu technicianId vào bảng, nhưng nếu muốn audit thì có thể thêm sau
  return await repo.addPartUsage(workOrderId, partId, quantity, unitPrice)
}

// Xóa PartUsage (kỹ thuật viên cho phần 'my' sử dụng)
async function deletePartUsageForMyWork(usageId, technicianId) {
  // Validate ownership: ensure the usage belongs to a work order that the technician owns/is assigned to
  const usage = await repo.getPartUsageById(usageId)
  if (!usage) throw new Error('Không tìm thấy bản ghi phụ tùng')

  const wo = await repo.getWorkOrderById(usage.WorkOrderID)
  if (!wo) throw new Error('Không tìm thấy WorkOrder tương ứng')

  // allow if technician is assigned to the work order
  if (wo.TechnicianID !== technicianId) {
    throw new Error('Bạn không có quyền xóa phụ tùng này')
  }

  return await repo.deletePartUsageById(usageId)
}

// Staff/admin can also delete by usage id
async function deletePartUsage(usageId) {
  return await repo.deletePartUsageById(usageId)
}
async function ensureInvoiceForWorkOrder(workOrderId) {
  const pool = await poolPromise;

  // 1. Tính tổng tiền dịch vụ trong WorkOrder
  const serviceTotalRs = await pool.request()
    .input('WorkOrderID', sql.Int, workOrderId)
    .query(`
      SELECT
        ISNULL(SUM(d.Quantity * d.UnitPrice), 0) AS TotalService
      FROM dbo.WorkOrderDetail d
      WHERE d.WorkOrderID = @WorkOrderID;
    `);

  const totalService = serviceTotalRs.recordset[0]?.TotalService || 0;

  // 2. Tính tổng tiền phụ tùng trong WorkOrder
  //  NOTE: nếu tên bảng phần phụ tùng khác (ví dụ WorkOrderPartUsage / PartUsage)
  //  thì sửa lại FROM cho đúng.
  const partsTotalRs = await pool.request()
    .input('WorkOrderID', sql.Int, workOrderId)
    .query(`
      SELECT
        ISNULL(SUM(p.Quantity * p.UnitPrice), 0) AS TotalParts
      FROM dbo.WorkOrderPartUsage p
      WHERE p.WorkOrderID = @WorkOrderID;
    `);

  const totalParts = partsTotalRs.recordset[0]?.TotalParts || 0;
  const totalAmount = Number(totalService) + Number(totalParts);

  // 3. Check xem đã có Invoice cho WorkOrder này chưa
  const existingRs = await pool.request()
    .input('WorkOrderID', sql.Int, workOrderId)
    .query(`
      SELECT TOP 1 InvoiceID, TotalAmount, PaymentStatus
      FROM dbo.Invoice
      WHERE WorkOrderID = @WorkOrderID;
    `);

  const existing = existingRs.recordset[0];

  if (!existing) {
    // 3a. Chưa có -> INSERT mới
    await pool.request()
      .input('WorkOrderID', sql.Int, workOrderId)
      .input('TotalAmount', sql.Money, totalAmount)
      .query(`
        INSERT INTO dbo.Invoice
          (AppointmentID, WorkOrderID, TotalAmount, PaymentStatus, CreatedAt)
        VALUES
          (NULL, @WorkOrderID, @TotalAmount, 'Unpaid', SYSDATETIME());
      `);
  } else {
    // 3b. Có rồi -> chỉ update TotalAmount (tránh đụng PaymentStatus)
    await pool.request()
      .input('WorkOrderID', sql.Int, workOrderId)
      .input('TotalAmount', sql.Money, totalAmount)
      .query(`
        UPDATE dbo.Invoice
        SET TotalAmount = @TotalAmount,
            UpdatedAt   = SYSDATETIME()
        WHERE WorkOrderID = @WorkOrderID;
      `);
  }

  return { totalService, totalParts, totalAmount };
}


module.exports = {
  // customer
  getMyActive,
  getMyCompleted,
  getMyDetail,
  // staff/admin
  listAll,
  getOne,
  create,
  addServiceDetail,
  deleteServiceDetail,
  addPartUsage,
  deletePartUsage,
  update,
  // technician
  startMyWork,
  completeMyWork,
  updateMyDiagnosis,
  addPartUsageForMyWork,
  deletePartUsageForMyWork,
  ensureInvoiceForWorkOrder,
}
