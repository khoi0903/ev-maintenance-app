const { buildCheckoutUrl, verifyReturn } = require('../utils/vnpay');
const invoiceService = require('./invoiceService');
const paymentRepo = require('../repositories/paymentRepository');

function nowVnpFormat(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function normalizeMethod(method) {
  const raw = String(method || '').trim();
  const lower = raw.toLowerCase();
  if (['atm', 'bank', 'banking'].includes(lower)) return 'Banking';
  if (['qr', 'vnpay', 'vnpayqr', 'ewallet', 'wallet'].includes(lower)) return 'VNPAY';
  if (lower === 'momo') return 'VNPAY';
  const upper = raw.toUpperCase();
  if (upper === 'BANKING' || upper === 'BANK') return 'Banking';
  if (upper === 'VNPAY' || upper === 'VNPAYQR') return 'VNPAY';
  return 'VNPAY';
}

class PaymentService {
  /**
   * Tạo (hoặc tái sử dụng) transaction Pending cho invoice của appointment.
   * - method: 'atm' | 'ewallet' | 'qr'
   * - bankCode (optional): 'VNBANK' | 'VNPAYQR' | ...; nếu không có sẽ map theo method.
   */
  async createVnpayCheckout({ appointmentId, serviceId, method='atm', bankCode, ipAddr='127.0.0.1', returnUrl }) {
    const inv = await invoiceService.ensureForAppointment(Number(appointmentId), { serviceId: Number(serviceId) });
    const normalizedMethod = normalizeMethod(method);
    return this.createVnpayCheckoutForInvoice({
      invoiceId: inv.InvoiceID,
      method: normalizedMethod,
      bankCode,
      ipAddr,
      returnUrl,
    });
  }

  async createVnpayCheckoutForInvoice({
    invoiceId,
    amount,
    method = 'Banking',
    bankCode,
    ipAddr = '127.0.0.1',
    returnUrl,
  }) {
    const inv = await invoiceService.getById(Number(invoiceId));
    if (!inv) throw new Error('Invoice not found');

    const invoiceAmount = Number(inv.TotalAmount || 0);
    if (!invoiceAmount || Number.isNaN(invoiceAmount)) {
      throw new Error('Invoice amount invalid');
    }

    if (amount != null && Math.round(Number(amount)) !== Math.round(invoiceAmount)) {
      throw new Error('Amount does not match invoice');
    }

    const normalizedMethod = normalizeMethod(method);

    let txn = await paymentRepo.findPendingByInvoiceAndMethod(inv.InvoiceID, normalizedMethod);
    if (!txn) {
      txn = await paymentRepo.create({
        invoiceId: inv.InvoiceID,
        amount: invoiceAmount,
        method: normalizedMethod,
        status: 'Pending',
        bankCode: bankCode || null,
        checkoutUrl: null,
      });
    }

    let vnpBank = bankCode;
    if (!vnpBank) {
      if (normalizedMethod === 'VNPAY') vnpBank = 'VNPAYQR';
      else vnpBank = 'VNBANK';
    }

    const tmnCode = process.env.VNP_TMN_CODE;
    const secret = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const fallbackReturnUrl = process.env.VNP_RETURN_URL;
    const ipnUrl = process.env.VNP_IPN_URL;

    const createDate = new Date();
    const expireDate = new Date(createDate.getTime() + 15 * 60 * 1000);
    const orderId = `${inv.InvoiceID}-${txn.TransactionID}`;

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan invoice ${inv.InvoiceID}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(invoiceAmount * 100),
      vnp_ReturnUrl: returnUrl || fallbackReturnUrl,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_CreateDate: nowVnpFormat(createDate),
      vnp_ExpireDate: nowVnpFormat(expireDate),
      vnp_BankCode: vnpBank,
    };
    if (ipnUrl) vnp_Params.vnp_IpnUrl = ipnUrl;

    const checkoutUrl = buildCheckoutUrl({
      vnpUrl,
      tmnCode,
      hashSecret: secret,
      params: vnp_Params,
    });

    await paymentRepo.saveGatewayMeta(txn.TransactionID, JSON.stringify({ method: normalizedMethod, bankCode: vnpBank }));
    await paymentRepo.saveCheckoutUrl(txn.TransactionID, checkoutUrl);

    return { checkoutUrl, invoiceId: inv.InvoiceID, paymentTxnId: txn.TransactionID };
  }

  verifyReturn(query) {
    return verifyReturn({ hashSecret: process.env.VNP_HASH_SECRET, vnpQuery: query });
  }

  async markSuccess({ invoiceId, paymentTxnId, meta }) {
    await paymentRepo.updateStatus(paymentTxnId, 'Success');
    await paymentRepo.saveGatewayMeta(paymentTxnId, JSON.stringify(meta || {}));
    await invoiceService.markPaid(invoiceId);
  }

  async markFail({ invoiceId, paymentTxnId, meta }) {
    await paymentRepo.updateStatus(paymentTxnId, 'Failed');
    await paymentRepo.saveGatewayMeta(paymentTxnId, JSON.stringify(meta || {}));
    await invoiceService.markUnpaid(invoiceId);
  }
}

module.exports = new PaymentService();
