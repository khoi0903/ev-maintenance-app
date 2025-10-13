const accountRepository = require("../repositories/accountRepository");
const bcrypt = require("bcrypt");

class AccountService {
  async getProfile(accountId) {
    return await accountRepository.getById(accountId);
  }

  async updateProfile(accountId, data) {
    await accountRepository.update(accountId, data);
    return { message: "Cập nhật thông tin tài khoản thành công" };
  }

  async deactivateAccount(accountId) {
    await accountRepository.deactivate(accountId);
    return { message: "Tài khoản đã được vô hiệu hóa" };
  }

  async getAll() {
    return await accountRepository.getAll();
  }
}

module.exports = new AccountService();
