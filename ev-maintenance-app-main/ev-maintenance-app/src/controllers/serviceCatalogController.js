// src/controllers/serviceCatalogController.js
const svc = require('../services/serviceCatalogService');

const ok = (res, data, code = 200) => res.status(code).json({ success: true, data });
const fail = (res, err) =>
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });

exports.getAll = async (_req, res) => {
  try {
    const rows = await svc.list();
    return ok(res, rows);
  } catch (err) {
    console.error('GET /api/services error:', err);
    return fail(res, err);
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await svc.get(id);
    return ok(res, row);
  } catch (err) {
    console.error('GET /api/services/:id error:', err);
    return fail(res, err);
  }
};

exports.create = async (req, res) => {
  try {
    const created = await svc.create(req.body);
    return ok(res, created, 201);
  } catch (err) {
    console.error('POST /api/services error:', err);
    return fail(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await svc.update(id, req.body);
    return ok(res, updated);
  } catch (err) {
    console.error('PUT /api/services/:id error:', err);
    return fail(res, err);
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await svc.remove(id);
    return ok(res, true);
  } catch (err) {
    console.error('DELETE /api/services/:id error:', err);
    return fail(res, err);
  }
};
