const { poolPromise, sql } = require('../db');
const invoiceRepo = require('../repositories/invoiceRepository');

/**
 * Lấy StandardCost của service cho appointment.
 * - Ưu tiên serviceId FE gửi; nếu không có, dùng a.ServiceID.
 */
async function getServiceStandardCost({ appointmentId, serviceId }) {
  const pool = await poolPromise;
  const req = pool.request()
    .input('AppointmentID', sql.Int, appointmentId);
  let q;
  if (serviceId) {
    req.input('ServiceID', sql.Int, serviceId);
    q = `
      SELECT sc.StandardCost
      FROM ServiceCatalog sc
      WHERE sc.ServiceID=@ServiceID
    `;
  } else {
    q = `
      SELECT TOP 1 sc.StandardCost
      FROM Appointment a
      JOIN ServiceCatalog sc ON sc.ServiceID = a.ServiceID
      WHERE a.AppointmentID=@AppointmentID
    `;
  }
  const rs = await req.query(q);
  const row = rs.recordset[0];
  if (!row) throw new Error('Không tìm thấy Service/StandardCost cho appointment');
  return Number(row.StandardCost || 0);
}

class InvoiceService {
  /**
   * Tạo hoặc lấy invoice cho appointment. Thu toàn bộ StandardCost.
   */
  async ensureForAppointment(appointmentId, { serviceId, feAmount } = {}) {
    const stdCost = await getServiceStandardCost({ appointmentId, serviceId });
    const total = Math.round(stdCost);
    if (!total || total <= 0) throw new Error('Invalid totalAmount when creating invoice');

    const existing = await invoiceRepo.getByAppointment(appointmentId);
    if (existing) {
      if (Number(existing.TotalAmount || 0) !== total) {
        await invoiceRepo.updateAmount(existing.InvoiceID, total);
        return { ...existing, TotalAmount: total };
      }
      return existing;
    }

    const inv = await invoiceRepo.createForAppointment({ appointmentId, totalAmount: total });
    return inv;
  }

  async markPaid(invoiceId) {
    return invoiceRepo.markPaid(invoiceId);
  }
  async markUnpaid(invoiceId) {
    return invoiceRepo.markUnpaid(invoiceId);
  }

  async getMine(accountId) {
    return invoiceRepo.listByAccount(accountId);
  }

  async listAll(filters = {}) {
    const finalFilters = {
      ...filters,
      completedOnly: filters.completedOnly === true,
    };
    console.log('[InvoiceService.listAll] Filters:', finalFilters);
    const result = await invoiceRepo.listAll(finalFilters);
    console.log('[InvoiceService.listAll] Result count:', result?.length || 0);
    return result;
  }

  async getById(id) {
    return invoiceRepo.getById(id);
  }

  async getByAppointment(appointmentId) {
    return invoiceRepo.getByAppointment(appointmentId);
  }

  async sendToCustomer(invoiceId, staffId) {
    return invoiceRepo.markSent(invoiceId, staffId);
  }

  // Customer bấm "Tôi đã chuyển khoản"
  async customerConfirmPaid(invoiceId, accountId) {
    const detail = await invoiceRepo.getByIdWithAccount(invoiceId);
    if (!detail) throw new Error('Invoice not found');
    if (!detail.AccountID || Number(detail.AccountID) !== Number(accountId)) {
      throw new Error('Bạn không được phép xác nhận hóa đơn này');
    }
    // 👉 chỉ set CustomerPaidAt, không set PaymentStatus='Paid'
    return invoiceRepo.markCustomerPaid(invoiceId);
  }
}

module.exports = new InvoiceService();
