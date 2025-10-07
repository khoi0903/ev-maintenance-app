const vehicleRepository = require("../repositories/vehicleRepository");

class VehicleService {
  async createVehicle(accountId, data) {
    return await vehicleRepository.createVehicle({ accountId, ...data });
  }

  async getVehiclesByAccount(accountId) {
    return await vehicleRepository.getVehiclesByAccount(accountId);
  }

  async updateVehicle(vehicleId, data) {
    await vehicleRepository.updateVehicle(vehicleId, data);
    return { message: "Vehicle updated successfully" };
  }

  async deactivateVehicle(vehicleId) {
    await vehicleRepository.deactivateVehicle(vehicleId);
    return { message: "Vehicle deactivated" };
  }
}

module.exports = new VehicleService();
