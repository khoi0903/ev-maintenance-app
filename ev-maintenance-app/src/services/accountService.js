const accountRepository = require("../repositories/accountRepository");

class AccountService {
  async getAccountById(id) {
    return await accountRepository.getAccountById(id);
  }

  async updateAccount(id, data) {
    await accountRepository.updateAccount(id, data);
    return { message: "Account updated successfully" };
  }

  async deactivateAccount(id) {
    await accountRepository.deactivateAccount(id);
    return { message: "Account deactivated" };
  }
}

module.exports = new AccountService();
