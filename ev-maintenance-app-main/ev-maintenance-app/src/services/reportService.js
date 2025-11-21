const reportRepository = require("../repositories/reportRepository");

class ReportService {
  async getRevenueByDateRange(startDate, endDate) {
    return await reportRepository.getRevenueByDateRange(startDate, endDate);
  }

  async getRevenueByTechnician(startDate, endDate) {
    return await reportRepository.getRevenueByTechnician(startDate, endDate);
  }

  async getSystemSummary() {
    return await reportRepository.getSystemSummary();
  }

  async getMonthlyWorkOrderTrend(year) {
    return await reportRepository.getMonthlyWorkOrderTrend(year);
  }
}

module.exports = new ReportService();
