const invoiceService = require('../services/invoiceService');

module.exports = {
  async listAll(req, res) {
    try {
      const filters = {
        status: req.query.status ? String(req.query.status) : undefined,
        accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
        completedOnly: req.query.completedOnly === 'true' ? true : undefined,
      };
      console.log('[InvoiceController.listAll] Request filters:', filters);
      const rows = await invoiceService.listAll(filters);
      console.log('[InvoiceController.listAll] Returning', rows?.length || 0, 'invoices');
      res.json({ success: true, data: rows || [] });
    } catch (e) {
      console.error('[InvoiceController.listAll] Error:', e);
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },

  // GET /invoices/my
  async getMine(req, res) {
    try {
      const me = req.user;
      const rows = await invoiceService.getMine(me.AccountID);
      res.json({ success: true, data: rows });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },

  // GET /invoices/:id
  async getById(req, res) {
    try {
      const inv = await invoiceService.getById(Number(req.params.id));
      if (!inv) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: inv });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },

  // GET /invoices/by-appointment?appointmentId=123
  async getByAppointment(req, res) {
    try {
      const appointmentId = Number(req.query.appointmentId);
      if (!appointmentId) return res.status(400).json({ success: false, message: 'Missing appointmentId' });
      const inv = await invoiceService.getByAppointment(appointmentId);
      res.json({ success: true, data: inv || null });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },

  // Staff/Admin: PATCH /invoices/:id/paid
  async markPaid(req, res) {
    try {
      await invoiceService.markPaid(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },

  // Staff/Admin: PATCH /invoices/:id/unpaid
  async markUnpaid(req, res) {
    try {
      await invoiceService.markUnpaid(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },

  async sendToCustomer(req, res) {
    try {
      const invoiceId = Number(req.params.id);
      if (!invoiceId) return res.status(400).json({ success: false, message: 'Invalid invoice id' });
      const staffId = req.user?.AccountID || null;
      const updated = await invoiceService.sendToCustomer(invoiceId, staffId);
      res.json({ success: true, data: updated });
    } catch (e) {
      console.error('[InvoiceController.sendToCustomer] Error:', e);
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },

  // Customer bấm "Tôi đã chuyển khoản"
  async customerPaid(req, res) {
    try {
      const invoiceId = Number(req.params.id);
      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'Invalid invoice id' });
      }
      const accountId = req.user?.AccountID;
      if (!accountId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const updated = await invoiceService.customerConfirmPaid(invoiceId, accountId);
      res.json({
        success: true,
        message: 'Đã ghi nhận yêu cầu thanh toán, vui lòng chờ nhân viên xác nhận.',
        data: updated,
      });
    } catch (e) {
      console.error('[InvoiceController.customerPaid] Error:', e);
      res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
  },
};
