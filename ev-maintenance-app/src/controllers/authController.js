const authService = require("../services/authService");

class AuthController {
  async registerCustomer(req, res) {
    try {
      const result = await authService.registerCustomer(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async createAccountByAdmin(req, res) {
    try {
      const result = await authService.createAccountByAdmin(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();
