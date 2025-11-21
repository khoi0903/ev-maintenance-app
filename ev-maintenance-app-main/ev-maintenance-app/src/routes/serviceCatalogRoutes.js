// src/routes/serviceCatalogRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/serviceCatalogController');

// GET list & detail: để public để FE hiển thị ngay
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// CRUD: nếu muốn bảo vệ thì quấn middleware auth vào 3 route dưới
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
