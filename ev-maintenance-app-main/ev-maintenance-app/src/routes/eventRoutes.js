const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth } = require('../middlewares/authMiddleware');
const { role } = require('../middlewares/roleMiddleware');

const allow = (...roles) => [auth, role(...roles)];

// Test route (không cần auth để test)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Events route is working!' });
});

router.get('/recent', allow('Admin', 'Staff'), eventController.getRecent);

module.exports = router;

