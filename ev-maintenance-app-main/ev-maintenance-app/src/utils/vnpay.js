const crypto = require('crypto');
const qs = require('qs');

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj)
    .filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
    .sort();
  for (const k of keys) sorted[k] = obj[k];
  return sorted;
}

function hmacSHA512(secret, data) {
  return crypto.createHmac('sha512', secret).update(data, 'utf8').digest('hex');
}

function buildCheckoutUrl({ vnpUrl, tmnCode, hashSecret, params }) {
  const clean = { ...params, vnp_TmnCode: tmnCode };
  const sorted = sortObject(clean);
  const signData = qs.stringify(sorted, { encode: false });
  const secureHash = hmacSHA512(hashSecret, signData);
  return `${vnpUrl}?${signData}&vnp_SecureHashType=HMACSHA512&vnp_SecureHash=${secureHash}`;
}

function verifyReturn({ hashSecret, vnpQuery }) {
  const data = { ...vnpQuery };
  const secureHash = data.vnp_SecureHash || data.vnp_SecureHashType && data.vnp_SecureHash;
  delete data.vnp_SecureHash;
  delete data.vnp_SecureHashType;

  const sorted = sortObject(data);
  const signData = qs.stringify(sorted, { encode: false });
  const check = hmacSHA512(hashSecret, signData);

  return { isValid: check === String(secureHash).toLowerCase(), ...data };
}

module.exports = { buildCheckoutUrl, verifyReturn };
