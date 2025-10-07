const vehicleService = require("../services/vehicleService");

class VehicleController {
  async createVehicle(req, res) {
    try {
      const result = await vehicleService.createVehicle(req.user.accountId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getVehicles(req, res) {
    try {
      const vehicles = await vehicleService.getVehiclesByAccount(req.user.accountId);
      res.json(vehicles);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const result = await vehicleService.updateVehicle(id, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deactivateVehicle(req, res) {
    try {
      const { id } = req.params;
      const result = await vehicleService.deactivateVehicle(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new VehicleController();
