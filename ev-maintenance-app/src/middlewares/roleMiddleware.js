exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied: Admin only" });
  }
  next();
};

exports.isStaff = (req, res, next) => {
  if (!["Staff", "Admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied: Staff/Admin only" });
  }
  next();
};
