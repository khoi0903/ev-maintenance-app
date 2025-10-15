const workOrderRepository = require("../repositories/workOrderRepository");

class WorkOrderService {
  async create(data) {
    const result = await workOrderRepository.createWorkOrder(data);
    return { message: "Tạo phiếu sửa chữa thành công", workOrder: result };
  }

  async updateStatus(workOrderId, status) {
    await workOrderRepository.updateProgress(workOrderId, status);
    return { message: "Cập nhật trạng thái phiếu sửa chữa thành công" };
  }

  async getByAppointment(appointmentId) {
    return await workOrderRepository.getByAppointment(appointmentId);
  }
}

module.exports = new WorkOrderService();
