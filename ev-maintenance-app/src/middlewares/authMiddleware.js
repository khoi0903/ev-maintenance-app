// authMiddleware.js (fixed)
const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ success: false, message: "Thiếu hoặc sai định dạng Bearer token" });
  }
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
