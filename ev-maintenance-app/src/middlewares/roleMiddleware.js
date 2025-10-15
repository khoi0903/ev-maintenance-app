// roleMiddleware.js (fixed)
module.exports = function (roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Chưa xác thực" });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Không đủ quyền truy cập" });
    }
    next();
  };
};
