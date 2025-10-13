const vehicleRepository = require("../repositories/vehicleRepository");

class VehicleService {
  async getAllByAccount(accountId) {
    return await vehicleRepository.getAllByAccount(accountId);
  }

  async createVehicle(data) {
    await vehicleRepository.create(data);
    return { message: "Thêm xe thành công" };
  }

  async updateVehicle(vehicleId, data) {
    await vehicleRepository.update(vehicleId, data);
    return { message: "Cập nhật xe thành công" };
  }

  async deleteVehicle(vehicleId) {
    await vehicleRepository.delete(vehicleId);
    return { message: "Xóa xe thành công" };
  }
}

module.exports = new VehicleService();
