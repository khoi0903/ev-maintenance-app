// src/services/invoiceService.js
const { poolPromise } = require("../db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { createPayment } = require("./paymentService");

exports.create = async (data) => {
  const pool = await poolPromise;
  const { AppointmentID, WorkOrderID, TotalAmount } = data;

  const result = await pool
    .request()
    .input("AppointmentID", AppointmentID || null)
    .input("WorkOrderID", WorkOrderID || null)
    .input("TotalAmount", TotalAmount)
    .query(`
      INSERT INTO Invoice (AppointmentID, WorkOrderID, TotalAmount, PaymentStatus)
      OUTPUT INSERTED.*
      VALUES (@AppointmentID, @WorkOrderID, @TotalAmount, 'Unpaid')
    `);

  return result.recordset[0];
};

exports.getByWorkOrder = async (workOrderId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("WorkOrderID", workOrderId)
    .query(`
      SELECT * FROM Invoice WHERE WorkOrderID = @WorkOrderID
    `);
  return result.recordset;
};

exports.markAsPaid = async (invoiceId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("InvoiceID", invoiceId)
    .query(`
      UPDATE Invoice
      SET PaymentStatus = 'Paid', UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE InvoiceID = @InvoiceID
    `);
  return result.recordset[0];
};

// ✅ Xuất hóa đơn PDF có mã QR thanh toán thật (VNPay)
exports.exportInvoicePdf = async (invoiceId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("InvoiceID", invoiceId)
    .query(`
      SELECT i.InvoiceID, i.TotalAmount, i.CreatedAt,
             a.FullName AS CustomerName, v.LicensePlate
      FROM Invoice i
      JOIN Appointment ap ON i.AppointmentID = ap.AppointmentID
      JOIN Vehicle v ON ap.VehicleID = v.VehicleID
      JOIN Account a ON ap.AccountID = a.AccountID
      WHERE i.InvoiceID = @InvoiceID
    `);

  if (result.recordset.length === 0) throw new Error("Không tìm thấy hóa đơn.");
  const invoice = result.recordset[0];

  const paymentData = await createPayment({
    orderId: `INV${invoice.InvoiceID}`,
    amount: invoice.TotalAmount,
    bankCode: "",
  });

  const doc = new PDFDocument();
  const pdfDir = path.join(__dirname, "../../invoices");
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
  const pdfPath = path.join(pdfDir, `invoice_${invoice.InvoiceID}.pdf`);
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  doc.fontSize(20).text("EV Service Center", { align: "center" });
  doc.fontSize(16).text("Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice ID: ${invoice.InvoiceID}`);
  doc.text(`Customer: ${invoice.CustomerName}`);
  doc.text(`License Plate: ${invoice.LicensePlate}`);
  doc.text(`Total: ${invoice.TotalAmount} VND`);
  doc.text(`Date: ${new Date(invoice.CreatedAt).toLocaleString()}`);
  doc.moveDown();

  doc.text("Scan QR to pay via VNPay:");
  doc.image(paymentData.qrCode, { fit: [150, 150], align: "center" });

  doc.moveDown();
  doc.text("Thank you for using EV Service Center!", {
    align: "center",
    underline: true,
  });

  doc.end();

  return {
    message: "Xuất hóa đơn PDF thành công",
    pdfPath,
    paymentUrl: paymentData.paymentUrl,
    qrCode: paymentData.qrCode,
  };
};
