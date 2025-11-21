// src/middlewares/roleMiddleware.js

const rolePerms = {
  Admin: [
    'users.read','users.write',
    'services.read','services.write',
    'vehicles.read','vehicles.write',
    'appointments.read','appointments.write',
    'workorders.read','workorders.write',
    'invoices.read','invoices.write',
    'reports.read','reports.write'
  ],
  Staff: [
    'services.read',
    'vehicles.read',
    'appointments.read','appointments.write',
    'workorders.read','workorders.write',
    'invoices.read'
  ],
  Technician: [
    'workorders.read','workorders.write',
    'vehicles.read',
    'appointments.read'
  ],
};

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    console.log('[roleMiddleware] user.role:', req.user.role, 'allowed roles:', roles);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}

function requirePerm(perm) {
  return (req, res, next) => {
    const role = req.user?.role;
    const allowed = role ? (rolePerms[role] || []) : [];
    if (!role) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!allowed.includes(perm)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
function requireRoleAny(...roles) {
  const allow = roles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    const got = String(req.user?.Role ?? req.user?.role ?? '').toLowerCase();
    if (!allow.length || allow.includes(got)) return next();
    return res.status(403).json({ success:false, message:'Forbidden' });
  };
}
module.exports = { requireRoleAny, role: requireRoleAny };

// ✅ Xuất cả 2 tên để route cũ/ mới đều chạy
module.exports = {
  rolePerms,
  requireRoles,
  role: requireRoles,
  requirePerm,
};
