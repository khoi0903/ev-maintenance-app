// src/controllers/appointmentController.js
const appointmentService = require('../services/appointmentService');

function handleError(res, ctx, err) {
  console.error(`[appointments/${ctx}]`, err);
  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Lỗi xử lý lịch hẹn',
  });
}

// Admin / Staff: list tất cả (có scope=admin ở FE)
exports.list = async (req, res) => {
  try {
    const scope = req.query.scope || 'admin';
    const data = await appointmentService.listAll({ scope });
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, 'list', err);
  }
};

// Customer: lấy lịch hẹn của mình
exports.getMine = async (req, res) => {
  try {
    const accountId = req.user.AccountID;
    const data = await appointmentService.getMine(accountId);
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, 'getMine', err);
  }
};

// Customer tạo lịch hẹn
exports.create = async (req, res) => {
  try {
    const accountId = req.user.AccountID;
    const payload = { ...req.body, accountId };
    const data = await appointmentService.create(payload);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return handleError(res, 'create', err);
  }
};

// Xác nhận đơn giản (không chọn kỹ thuật viên)
exports.simpleConfirm = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const staffId = req.user.AccountID;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu appointmentId',
      });
    }

    const data = await appointmentService.simpleConfirm({
      appointmentId,
      staffId,
    });

    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, 'simpleConfirm', err);
  }
};

// ✅ Xác nhận + chọn kỹ thuật viên + tạo WorkOrder
exports.confirmWithTechnician = async (req, res) => {
  try {
    // FE đang gửi { appointmentId, technicianId } trong body
    const { appointmentId, technicianId } = req.body;
    const apptId = Number(appointmentId);

    if (!apptId || isNaN(apptId)) {
      return res.status(400).json({
        success: false,
        message: 'AppointmentID không hợp lệ',
      });
    }

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu technicianId',
      });
    }

    const staffId = req.user?.AccountID || null;

    const result = await appointmentService.confirmWithTechnician(
      apptId,
      technicianId,
      staffId
    );

    return res.json({ success: true, data: result });
  } catch (err) {
    return handleError(res, 'confirmWithTechnician', err);
  }
};

// Hủy lịch hẹn
exports.cancel = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const actorId = req.user.AccountID;
    const actorRole = req.user.Role;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu appointmentId',
      });
    }

    const data = await appointmentService.cancel({
      appointmentId,
      actorId,
      actorRole,
    });

    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, 'cancel', err);
  }
};
