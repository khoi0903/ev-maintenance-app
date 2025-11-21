const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success:false, message:'Missing or invalid token' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ success:false, message:'Invalid token' });

    // Chuẩn hoá field để code cũ/mới dùng chung
    req.user = {
      ...payload,                                    // { sub, AccountID, Username, Role, ... }
      accountId: payload.AccountID ?? payload.sub,   // <-- thêm camelCase
      role: (payload.Role || '').toString()
    };
    next();
  });
};
