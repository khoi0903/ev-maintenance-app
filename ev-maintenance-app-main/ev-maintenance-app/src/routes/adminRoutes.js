// src/routes/adminRoutes.js
const router = require('express').Router();

// ✅ ĐÚNG đường dẫn (thư mục của bạn là "middlewares")
const { requireAuth }  = require('../middlewares/authMiddleware');
const { requireRoles, requirePerm } = require('../middlewares/roleMiddleware');

// (ví dụ) controller có thể để sau, hoặc test trước bằng handler đơn giản
// const adminCtrl = require('../controllers/adminController');

// Cho phép 3 role vào khu admin chung
router.use(requireAuth, requireRoles('Admin', 'Staff', 'Technician'));

// Endpoint test nhanh để chắc chắn route chạy
router.get('/ping', (_req, res) => res.json({ success: true, who: 'admin area' }));

// Ví dụ: chỉ Admin xem danh sách users
// router.get('/users', requirePerm('users.read'), adminCtrl.listUsers);

module.exports = router;
