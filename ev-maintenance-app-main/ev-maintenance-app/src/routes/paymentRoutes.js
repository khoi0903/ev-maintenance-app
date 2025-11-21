const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const paymentRepo    = require('../repositories/paymentRepository');
const invoiceService = require('../services/invoiceService');
const { auth } = require('../middlewares/authMiddleware');
const { role } = require('../middlewares/roleMiddleware');

const allow = (...roles) => [auth, role(...roles)];

// Tạo / tái sử dụng checkout (VNPay)
router.post('/', auth, async (req, res) => {
  try {
    const { appointmentId, serviceId, method = 'atm', bankCode } = req.body;
    if (!appointmentId || !serviceId) {
      return res.status(400).json({ success: false, message: 'Missing appointmentId or serviceId' });
    }

    const ipAddr =
      (req.headers['x-forwarded-for'] || '').split(',')[0] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const { checkoutUrl, invoiceId, paymentTxnId } =
      await paymentService.createVnpayCheckout({ appointmentId, serviceId, method, bankCode, ipAddr });

    return res.json({ success: true, data: { checkoutUrl, invoiceId, paymentTxnId } });
  } catch (e) {
    console.error('[payments/create] err:', e);
    res.status(500).json({ success: false, message: e.message || 'Create payment error' });
  }
});

router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { invoiceId, amount, method = 'Banking', bankCode, returnUrl } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'Missing invoiceId' });
    }

    const normalizedMethod = String(method).toUpperCase();
    if (!['BANKING', 'VNPAY'].includes(normalizedMethod)) {
      return res.status(400).json({ success: false, message: 'Unsupported method' });
    }

    const ipAddr =
      (req.headers['x-forwarded-for'] || '').split(',')[0] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const { checkoutUrl, paymentTxnId } = await paymentService.createVnpayCheckoutForInvoice({
      invoiceId,
      amount,
      method: normalizedMethod,
      bankCode,
      ipAddr,
      returnUrl,
    });

    return res.json({ success: true, data: { checkoutUrl, paymentTxnId, invoiceId } });
  } catch (e) {
    console.error('[payments/create-checkout] err:', e);
    res.status(500).json({ success: false, message: e.message || 'Create payment error' });
  }
});

// FE gọi để tải invoice + pending transaction khi refresh
// GET /payments/by-appointment?appointmentId=..&serviceId=..
router.get('/by-appointment', auth, async (req, res) => {
  try {
    const appointmentId = Number(req.query.appointmentId);
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : undefined;
    if (!appointmentId) return res.status(400).json({ success: false, message: 'Missing appointmentId' });

    const invoice = await invoiceService.ensureForAppointment(appointmentId, { serviceId });
    const pending = await paymentRepo.findPendingByInvoiceAndMethod(invoice.InvoiceID, 'Banking')
                  || await paymentRepo.findPendingByInvoiceAndMethod(invoice.InvoiceID, 'VNPAY')
                  || await paymentRepo.findPendingByInvoiceAndMethod(invoice.InvoiceID, 'atm')
                  || await paymentRepo.findPendingByInvoiceAndMethod(invoice.InvoiceID, 'ewallet')
                  || await paymentRepo.findPendingByInvoiceAndMethod(invoice.InvoiceID, 'qr');

    res.json({
      success: true,
      data: pending ? {
        invoice,
        pending: {
          transactionId: pending.TransactionID,
          status: pending.Status,
          amount: pending.Amount,
          method: pending.Method,
          updatedAt: pending.UpdatedAt || pending.CreatedAt,
        }
      } : { invoice, pending: null }
    });
  } catch (e) {
    console.error('[payments/by-appointment] err:', e);
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
});

// Poll status
router.get('/:txnId/status', auth, async (req, res) => {
  try {
    const txnId = Number(req.params.txnId);
    if (!txnId) return res.status(400).json({ success: false, message: 'Invalid transaction id' });

    const txn = await paymentRepo.getById(txnId);
    if (!txn) return res.status(404).json({ success: false, message: 'Not found' });

    return res.json({
      success: true,
      data: {
        transactionId: txn.TransactionID,
        invoiceId: txn.InvoiceID,
        status: txn.Status,
        amount: txn.Amount,
        method: txn.Method,
        updatedAt: txn.UpdatedAt || txn.CreatedAt
      }
    });
  } catch (e) {
    console.error('[payments/:id/status] err:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', allow('Staff','Admin'), async (req, res) => {
  try {
    const filters = {
      invoiceId: req.query.invoiceId ? Number(req.query.invoiceId) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
    };
    const rows = await paymentRepo.listAll(filters);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('[payments/list]', e);
    res.status(500).json({ success: false, message: e.message || 'Server error' });
  }
});

// Return URL (user browser quay lại)
router.get('/vnpay-return', async (req, res) => {
  try {
    const vr = paymentService.verifyReturn(req.query);
    const ref = String(req.query.vnp_TxnRef || '');
    const [invoiceIdStr, txnIdStr] = ref.split('-');
    const invoiceId = Number(invoiceIdStr);
    const paymentTxnId = Number(txnIdStr);

    if (!vr.isValid || !invoiceId || !paymentTxnId) {
      try { await paymentService.markFail({ invoiceId, paymentTxnId, meta: req.query }); } catch {}
      return res.redirect(`http://localhost:3000/user/payment/fail?reason=invalid_return`);
    }

    if (req.query.vnp_ResponseCode === '00') {
      await paymentService.markSuccess({ invoiceId, paymentTxnId, meta: req.query });
      return res.redirect(`http://localhost:3000/user/payment/success?invoiceId=${invoiceId}`);
    } else {
      await paymentService.markFail({ invoiceId, paymentTxnId, meta: req.query });
      return res.redirect(`http://localhost:3000/user/payment/fail?code=${req.query.vnp_ResponseCode}`);
    }
  } catch (e) {
    console.error('[payments/vnpay-return] err:', e);
    return res.redirect(`http://localhost:3000/user/payment/fail?reason=server_error`);
  }
});

// IPN (server-to-server)
router.get('/vnpay-ipn', async (req, res) => {
  try {
    const vr = paymentService.verifyReturn(req.query);
    const ref = String(req.query.vnp_TxnRef || '');
    const [invoiceIdStr, txnIdStr] = ref.split('-');
    const invoiceId = Number(invoiceIdStr);
    const paymentTxnId = Number(txnIdStr);

    if (!vr.isValid || !invoiceId || !paymentTxnId) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature or ref' });
    }

    if (req.query.vnp_ResponseCode === '00') {
      await paymentService.markSuccess({ invoiceId, paymentTxnId, meta: req.query });
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      await paymentService.markFail({ invoiceId, paymentTxnId, meta: req.query });
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Fail saved' });
    }
  } catch (e) {
    console.error('[payments/vnpay-ipn] err:', e);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

module.exports = router;
