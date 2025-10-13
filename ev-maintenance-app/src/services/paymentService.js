// src/services/paymentService.js
const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const QRCode = require("qrcode");
require("dotenv").config();

exports.createPayment = async ({ orderId, amount, bankCode }) => {
  try {
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    const vnp_TmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    const ipAddr = "127.0.0.1";
    const locale = "vn";
    const currCode = "VND";

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toán hóa đơn ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    // Sắp xếp theo thứ tự alphabet
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((obj, key) => ((obj[key] = vnp_Params[key]), obj), {});

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;

    // ✅ Tạo mã QR
    const qrCode = await QRCode.toDataURL(paymentUrl);

    return { paymentUrl, qrCode };
  } catch (error) {
    console.error("❌ Lỗi tạo QR Payment:", error);
    throw error;
  }
};
