// src/services/serviceCatalogService.js
const repo = require('../repositories/serviceCatalogRepository');

function ensureCreate(data) {
  if (!data || typeof data.ServiceName !== 'string' || !data.ServiceName.trim()) {
    throw Object.assign(new Error('ServiceName is required'), { status: 400 });
  }
  if (data.StandardCost === undefined || data.StandardCost === null || isNaN(Number(data.StandardCost))) {
    throw Object.assign(new Error('StandardCost must be a number'), { status: 400 });
  }
}

exports.list = async () => await repo.getAll();

exports.get = async (id) => {
  const item = await repo.getById(id);
  if (!item) throw Object.assign(new Error('Service not found'), { status: 404 });
  return item;
};

exports.create = async (data) => {
  ensureCreate(data);
  return await repo.create(data);
};

exports.update = async (id, data) => {
  const exists = await repo.getById(id);
  if (!exists) throw Object.assign(new Error('Service not found'), { status: 404 });
  return await repo.update(id, data);
};

exports.remove = async (id) => {
  const ok = await repo.remove(id);
  if (!ok) throw Object.assign(new Error('Service not found'), { status: 404 });
  return true;
};
