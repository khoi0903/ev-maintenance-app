const router = require('express').Router();
const { auth } = require('../middlewares/authMiddleware');
const { role } = require('../middlewares/roleMiddleware');
const allow = (...roles) => [auth, role(...roles)];
const modelController = require('../controllers/modelController');

// Cho tất cả role xem danh sách model
router.get('/', allow('Customer','Staff','Technician','Admin'), modelController.list);

module.exports = router;
