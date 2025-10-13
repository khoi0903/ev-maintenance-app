const accountService = require("../services/accountService");

exports.getProfile = async (req, res) => {
  try {
    const profile = await accountService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin tài khoản", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const result = await accountService.updateProfile(req.user.id, req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi cập nhật tài khoản", error: error.message });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const result = await accountService.deactivateAccount(req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi khi vô hiệu hóa tài khoản", error: error.message });
  }
};
