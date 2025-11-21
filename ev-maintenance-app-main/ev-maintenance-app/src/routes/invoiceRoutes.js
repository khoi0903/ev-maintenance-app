const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { auth } = require('../middlewares/authMiddleware');
const { role } = require('../middlewares/roleMiddleware');
const allow = (...roles) => [auth, role(...roles)];

// Customer xem hóa đơn của chính mình
router.get('/my', auth, invoiceController.getMine);
router.get('/', allow('Staff','Admin'), invoiceController.listAll);

// Xem invoice theo appointment
router.get('/by-appointment', auth, invoiceController.getByAppointment);

// Xem invoice cụ thể
router.get('/:id', auth, invoiceController.getById);

// Đổi trạng thái (staff/admin)
router.patch('/:id/paid', allow('Staff','Admin'), invoiceController.markPaid);
router.patch('/:id/unpaid', allow('Staff','Admin'), invoiceController.markUnpaid);
router.post('/:id/send', allow('Staff','Admin'), invoiceController.sendToCustomer);
router.post('/:id/customer-paid', auth, invoiceController.customerPaid);

module.exports = router;
