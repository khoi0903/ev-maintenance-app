const serviceCatalogRepository = require("../repositories/serviceCatalogRepository");

exports.getAllServices = () => serviceCatalogRepository.getAllServices();
exports.createService = (data) => serviceCatalogRepository.createService(data);
exports.updateService = (id, data) => serviceCatalogRepository.updateService(id, data);
exports.deleteService = (id) => serviceCatalogRepository.deleteService(id);
