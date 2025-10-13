// src/controllers/paymentController.js
const paymentService = require("../services/paymentService");
const { poolPromise } = require("../db");
const crypto = require("crypto");
const qs = require("qs");

exports.create = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const pool = await poolPromise;

    // Lấy thông tin hóa đơn
    const invoice = await pool
      .request()
      .input("InvoiceID", invoiceId)
      .query("SELECT * FROM Invoice WHERE InvoiceID = @InvoiceID");

    if (invoice.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    const inv = invoice.recordset[0];

    const payment = await paymentService.createPayment({
      orderId: `INV${inv.InvoiceID}`,
      amount: inv.TotalAmount,
      bankCode: "",
    });

    res.status(200).json({
      success: true,
      message: "Tạo yêu cầu thanh toán thành công",
      invoiceId,
      paymentUrl: payment.paymentUrl,
      qrCode: payment.qrCode,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo thanh toán:", error);
    res.status(500).json({ success: false, message: "Lỗi khi tạo thanh toán", error: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("InvoiceID", invoiceId)
      .query("SELECT * FROM PaymentTransaction WHERE InvoiceID = @InvoiceID");
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách thanh toán", error: error.message });
  }
};

// ✅ Gộp luôn callback VNPay vào đây
exports.vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const secretKey = process.env.VNP_HASHSECRET;

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((obj, key) => ((obj[key] = vnp_Params[key]), obj), {});

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const pool = await poolPromise;

      const orderId = vnp_Params["vnp_TxnRef"].replace("INV", "");
      const amount = parseFloat(vnp_Params["vnp_Amount"]) / 100;
      const responseCode = vnp_Params["vnp_ResponseCode"];

      if (responseCode === "00") {
        await pool.request()
          .input("InvoiceID", orderId)
          .query(`UPDATE Invoice SET PaymentStatus = 'Paid' WHERE InvoiceID = @InvoiceID`);

        await pool.request()
          .input("InvoiceID", orderId)
          .input("Amount", amount)
          .input("Method", "VNPay")
          .input("Status", "Success")
          .query(`
            INSERT INTO PaymentTransaction (InvoiceID, Amount, Method, Status)
            VALUES (@InvoiceID, @Amount, @Method, @Status)
          `);

        return res.status(200).send("Thanh toán thành công ✅");
      } else {
        return res.status(400).send("Thanh toán thất bại ❌");
      }
    } else {
      res.status(403).send("Chữ ký không hợp lệ!");
    }
  } catch (error) {
    res.status(500).send("Lỗi xử lý callback");
  }
};
