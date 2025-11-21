// src/services/accountService.js
const bcrypt = require('bcrypt');
const accountRepository = require('../repositories/accountRepository');

class AccountService {
  async getProfile(accountId) {
    return await accountRepository.getAccountById(accountId);
  }

  async listAccounts() {
    return await accountRepository.getAll();
  }

  async listTechnicians() {
    return await accountRepository.getTechnicians();
  }

  async adminCreateAccount(payload = {}) {
    const {
      username,
      password,
      role = 'Customer',
      fullName,
      email,
      phone,
      address,
      status = 'Active',
    } = payload;

    if (!username) throw new Error('Username is required');
    if (!password) throw new Error('Password is required');

    const existed = await accountRepository.getAccountByUsername(username);
    if (existed) throw new Error('Username already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    return await accountRepository.createAccount({
      username,
      passwordHash,
      role,
      fullName,
      email,
      phone,
      address,
      status,
    });
  }

  async adminUpdateAccount(accountId, payload = {}) {
    if (!accountId) throw new Error('Account ID is required');
    const allowed = {};
    const pick = (key, ...aliases) => {
      for (const name of [key, ...aliases]) {
        if (Object.prototype.hasOwnProperty.call(payload, name) && payload[name] !== undefined) {
          allowed[key] = payload[name];
          return;
        }
      }
    };

    pick('fullName', 'FullName');
    pick('email', 'Email');
    pick('phone', 'Phone');
    pick('address', 'Address');
    pick('role', 'Role');
    pick('status', 'Status');

    return await accountRepository.updatePartial(accountId, allowed);
  }

  async adminResetPassword(accountId, password) {
    if (!accountId) throw new Error('Account ID is required');
    if (!password) throw new Error('Password is required');
    const passwordHash = await bcrypt.hash(password, 10);
    return await accountRepository.updatePassword(accountId, passwordHash);
  }

  async updateSelf(userId, payload) {
    // chỉ các trường cho phép từ FE
    const allowed = {
      fullName: payload.fullName ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      gender: payload.gender ?? null,
    };
    return await accountRepository.updatePartial(userId, allowed);
  }
  
}

module.exports = new AccountService();
