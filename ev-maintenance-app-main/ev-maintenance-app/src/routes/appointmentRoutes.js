// src/routes/appointmentRoutes.js
const router = require('express').Router();
const { auth } = require('../middlewares/authMiddleware');
const { role } = require('../middlewares/roleMiddleware');

const allow = (...roles) => [auth, role(...roles)];
const appointmentController = require('../controllers/appointmentController');

// =============== PUBLIC / CUSTOMER ===============

// Customer xem lịch hẹn của mình
router.get('/my', allow('Customer'), appointmentController.getMine);

// Customer tạo lịch hẹn
router.post('/', allow('Customer'), appointmentController.create);

// =============== ADMIN / STAFF ===============

// Admin / Staff xem toàn bộ lịch hẹn
router.get(
  '/',
  allow('Admin', 'Staff'),
  appointmentController.list
);

// Xác nhận đơn giản (KHÔNG chọn kỹ thuật viên – nếu còn dùng)
router.post(
  '/:id/confirm',
  allow('Admin', 'Staff'),
  appointmentController.simpleConfirm
);

// ✅ Xác nhận + gán kỹ thuật viên + tạo WorkOrder
// FE gọi: POST /api/appointments/confirm-with-technician
// Body: { appointmentId: number, technicianId: number }
router.post(
  '/confirm-with-technician',
  allow('Admin', 'Staff'),
  appointmentController.confirmWithTechnician
);

// Hủy lịch (customer hoặc admin / staff)
router.delete(
  '/:id',
  allow('Customer', 'Admin', 'Staff'),
  appointmentController.cancel
);

module.exports = router;
