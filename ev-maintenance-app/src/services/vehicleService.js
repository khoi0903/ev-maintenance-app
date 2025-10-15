const vehicleRepository = require("../repositories/vehicleRepository");

class VehicleService {
  async getAllByAccount(accountId) {
    return await vehicleRepository.getAllByAccount(accountId);
  }

  async createVehicle(data) {
    await vehicleRepository.createVehicle(data);
    return { message: "Thêm xe thành công" };
  }

  async updateVehicle(vehicleId, data) {
    await vehicleRepository.updateVehicle(vehicleId, data);
    return { message: "Cập nhật xe thành công" };
  }

  async deleteVehicle(vehicleId) {
    await vehicleRepository.deleteVehicle(vehicleId);
    return { message: "Xóa (vô hiệu hóa) xe thành công" };
  }
}

module.exports = new VehicleService();
