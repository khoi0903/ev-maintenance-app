// src/controllers/accountController.js
const accountService = require('../services/accountService');

exports.getAll = async (_req, res) => {
  try {
    const accounts = await accountService.listAccounts();
    res.json({ success: true, data: accounts });
  } catch (e) {
    console.error('accountController.getAll error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const id = req.user?.AccountID ?? req.user?.sub;
    if (!id) return res.status(401).json({ success:false, message:'Unauthorized' });

    const me = await accountService.getProfile(id);
    if (!me) return res.status(404).json({ success:false, message:'Account not found' });

    res.json({ success:true, data: me });
  } catch (e) {
    console.error('accountController.getMe error:', e);
    res.status(500).json({ success:false, message: e.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const created = await accountService.adminCreateAccount(req.body || {});
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    console.error('accountController.createAccount error:', e);
    const status = e.message && /exists|required/i.test(e.message) ? 400 : 500;
    res.status(status).json({ success: false, message: e.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    if (!accountId) return res.status(400).json({ success: false, message: 'Invalid account id' });
    const updated = await accountService.adminUpdateAccount(accountId, req.body || {});
    res.json({ success: true, data: updated });
  } catch (e) {
    console.error('accountController.updateAccount error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    if (!accountId) return res.status(400).json({ success: false, message: 'Invalid account id' });
    const { password, newPassword } = req.body || {};
    const targetPassword = newPassword || password;
    if (!targetPassword) return res.status(400).json({ success: false, message: 'Password is required' });

    await accountService.adminResetPassword(accountId, targetPassword);
    res.json({ success: true });
  } catch (e) {
    console.error('accountController.resetPassword error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const id = req.user?.AccountID ?? req.user?.sub;
    if (!id) return res.status(401).json({ success:false, message:'Unauthorized' });

    const updated = await accountService.updateSelf(id, req.body || {});
    res.json({ success:true, data: updated });
  } catch (e) {
    console.error('accountController.updateMe error:', e);
    res.status(500).json({ success:false, message: e.message });
  }
};

exports.getTechnicians = async (_req, res) => {
  try {
    const technicians = await accountService.listTechnicians();
    res.json({ success: true, data: technicians });
  } catch (e) {
    console.error('accountController.getTechnicians error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};
