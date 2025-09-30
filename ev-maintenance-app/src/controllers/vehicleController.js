const vehicleRepo = require("../repositories/vehicleRepository");

// POST /vehicles
async function createVehicle(req, res) {
  try {
    const { accountId, modelId, vin, licensePlate, year } = req.body;
    const vehicle = await vehicleRepo.createVehicle({ accountId, modelId, vin, licensePlate, year });
    res.json({ message: "Thêm xe thành công", vehicle });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi thêm xe", error: err.message });
  }
}

// GET /vehicles/:accountId
async function getVehiclesByAccount(req, res) {
  try {
    const { accountId } = req.params;
    const vehicles = await vehicleRepo.getVehiclesByAccount(accountId);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách xe", error: err.message });
  }
}

// GET /vehicle/:id
async function getVehicleById(req, res) {
  try {
    const { id } = req.params;
    const vehicle = await vehicleRepo.getVehicleById(id);
    if (!vehicle) return res.status(404).json({ message: "Không tìm thấy xe" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin xe", error: err.message });
  }
}

// PUT /vehicle/:id
async function updateVehicle(req, res) {
  try {
    const { id } = req.params;
    const { modelId, licensePlate, year } = req.body;
    const updated = await vehicleRepo.updateVehicle(id, { modelId, licensePlate, year });
    res.json({ message: "Cập nhật xe thành công", vehicle: updated });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật xe", error: err.message });
  }
}

// DELETE /vehicle/:id
async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;
    await vehicleRepo.deleteVehicle(id);
    res.json({ message: "Xóa xe thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa xe", error: err.message });
  }
}

// GET /vehicle/:id/services
async function getVehicleServiceHistory(req, res) {
  try {
    const { id } = req.params;
    const rows = await vehicleRepo.getVehicleServiceHistory(id);

    // Gom dữ liệu theo WorkOrderID
    const history = {};
    rows.forEach(row => {
      if (!history[row.WorkOrderID]) {
        history[row.WorkOrderID] = {
          WorkOrderID: row.WorkOrderID,
          StartTime: row.StartTime,
          EndTime: row.EndTime,
          ProgressStatus: row.ProgressStatus,
          TotalAmount: row.TotalAmount,
          Services: [],
          Parts: []
        };
      }

      if (row.ServiceName) {
        history[row.WorkOrderID].Services.push({
          ServiceName: row.ServiceName,
          Quantity: row.ServiceQty,
          SubTotal: row.ServiceSubTotal
        });
      }

      if (row.PartName) {
        history[row.WorkOrderID].Parts.push({
          PartName: row.PartName,
          Quantity: row.PartQty,
          SubTotal: row.PartSubTotal
        });
      }
    });

    res.json(Object.values(history));
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử dịch vụ", error: err.message });
  }
}

module.exports = {
  createVehicle,
  getVehiclesByAccount,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleServiceHistory,
};
