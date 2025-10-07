const accountService = require("../services/accountService");

class AccountController {
  async getProfile(req, res) {
    try {
      const account = await accountService.getAccountById(req.user.accountId);
      res.json(account);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const result = await accountService.updateAccount(req.user.accountId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deactivateAccount(req, res) {
    try {
      const result = await accountService.deactivateAccount(req.user.accountId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new AccountController();
