const router = require('express').Router();
const { auth } = require('../middlewares/authMiddleware');
const { requireRoles, role } = require('../middlewares/roleMiddleware');
const accountController = require('../controllers/accountController');

const allow = (...roles) => [auth, role(...roles)];

// Authenticated routes
router.use(auth);

router.get('/me', accountController.getMe);
router.put('/me', accountController.updateMe);

// Get technicians list (for Staff/Admin to assign work orders)
router.get('/technicians', allow('Admin', 'Staff'), accountController.getTechnicians);

// Admin only
router.use(requireRoles('Admin'));

router.get('/', accountController.getAll);
router.post('/', accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.post('/:id/reset-password', accountController.resetPassword);

module.exports = router;
