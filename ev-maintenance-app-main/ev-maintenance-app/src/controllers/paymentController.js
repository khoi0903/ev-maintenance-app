// controllers/paymentController.js
const paymentService = require('../services/paymentService');
const paymentRepo = require('../repositories/paymentRepository');

class PaymentController {
  // POST /api/payments
  async create(req, res) {
    try {
      const { invoiceFor, appointmentId, serviceId, amount, method, meta } = req.body;
      if (invoiceFor !== 'appointment') {
        return res.status(400).json({ success:false, message:'invoiceFor must be "appointment"' });
      }
      if (!appointmentId || !serviceId) {
        return res.status(400).json({ success:false, message:'Missing appointmentId or serviceId' });
      }

      const out = await paymentService.createVnpayCheckout({
        appointmentId: Number(appointmentId),
        serviceId: Number(serviceId),
        amount: amount ? Number(amount) : undefined,
        method: method || 'VNPAY'
      });

      return res.json({
        success: true,
        data: {
          checkoutUrl: out.checkoutUrl,
          invoiceId: out.invoiceId,
          paymentTxnId: out.transactionId
        }
      });
    } catch (e) {
      res.status(500).json({ success:false, message: e.message });
    }
  }

  // GET /api/payments/:txnId/status
  async status(req, res) {
    try {
      const txnId = Number(req.params.txnId);
      const row = await paymentRepo.getById(txnId);
      if (!row) return res.status(404).json({ success:false, message:'Not found' });
      res.json({ success:true, data:{ status: row.Status, invoiceId: row.InvoiceID }});
    } catch (e) {
      res.status(500).json({ success:false, message:e.message });
    }
  }

  // GET /api/payments/vnpay/return  (tuỳ bạn đang mount)
  async vnpReturn(req, res) {
    try {
      const verify = paymentService.verifyReturn(req.query);
      const [invoiceIdStr, txnIdStr] = String(req.query.vnp_TxnRef || '').split('-');
      const invoiceId = Number(invoiceIdStr);
      const transactionId = Number(txnIdStr);

      if (verify.isValid && req.query.vnp_ResponseCode === '00') {
        await paymentService.markSuccess({ invoiceId, transactionId, meta: req.query });
        return res.redirect(process.env.CLIENT_SUCCESS_URL); // FE success
      }
      await paymentService.markFail({ invoiceId, transactionId, meta: req.query });
      return res.redirect(process.env.CLIENT_FAIL_URL); // FE fail
    } catch (e) {
      res.status(500).send('Error');
    }
  }
}

module.exports = new PaymentController();
