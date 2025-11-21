// src/routes/inventoryRoutes.js
const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/inventoryController')
const { auth } = require('../middlewares/authMiddleware')
const { role } = require('../middlewares/roleMiddleware')

const allow = (...roles) => [auth, role(...roles)]

// Hai endpoint FE đang dùng:
// adminService.listInventory  -> GET /admin/inventory
// adminService.listLowStockInventory -> GET /admin/inventory/low-stock

router.get('/', allow('Admin', 'Staff', 'Technician'), ctrl.listInventory)
router.get('/low-stock', allow('Admin', 'Staff','Technician'), ctrl.listLowStockInventory)
router.post('/', allow('Admin', 'Staff','Technician'), ctrl.createInventory)
router.put('/:partId', allow('Admin', 'Staff'), ctrl.updateInventory)
router.delete('/:partId', allow('Admin', 'Staff'), ctrl.deleteInventory)

module.exports = router
