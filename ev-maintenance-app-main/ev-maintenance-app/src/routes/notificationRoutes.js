const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middlewares/authMiddleware');
const { role } = require('../middlewares/roleMiddleware');

const allow = (...roles) => [auth, role(...roles)];

// Test route (không cần auth để test)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Notifications route is working!' });
});

router.get('/', allow('Admin', 'Staff', 'Technician'), notificationController.getAll);

router.patch('/:id/read', allow('Admin', 'Staff', 'Technician'), notificationController.markAsRead);

module.exports = router;

