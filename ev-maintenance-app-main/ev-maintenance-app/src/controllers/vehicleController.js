// controllers/vehicleController.js
const vehicleService = require("../services/vehicleService");
const vehicleRepository = require("../repositories/vehicleRepository"); // ✅ BẮT BUỘC

/** helper lấy accountId từ token/user */
function getUserAccountId(req) {
  return (
    req.user?.AccountID ??
    req.user?.accountId ??
    req.user?.id ?? null
  );
}

exports.getAllByAccount = async (req, res) => {
  try {
    const role = req.user?.role;
    let accountId;

    if (role === "Customer") {
      accountId = getUserAccountId(req);            // bắt buộc xem của mình
    } else {
      // Admin/Staff: có thể truyền ?accountId=... để lọc, không truyền -> xem tất cả
      accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    }

    const data = await vehicleService.list({ accountId });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi lấy danh sách xe", error: String(err.message || err) });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await vehicleService.getById(id);
    if (!row) return res.status(404).json({ success: false, message: "Không tìm thấy xe" });

    // Customer chỉ xem được xe của mình
    if (req.user?.role === "Customer") {
      const myAcc = getUserAccountId(req);
      if (row.accountId !== myAcc) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập xe này" });
      }
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi lấy chi tiết xe", error: String(err.message || err) });
  }
};

exports.create = async (req, res) => {
  try {
    // AccountID: Customer phải là account của chính mình; Admin/Staff có thể truyền trong body
    const role = req.user?.role;
    let accountId = Number(req.body.AccountID ?? req.body.accountId);

    if (role === "Customer") {
      accountId = getUserAccountId(req);
    }
    if (!accountId) {
      return res.status(400).json({ success: false, message: "AccountID is required" });
    }

    const payload = {
      ...req.body,
      AccountID: Number(accountId) || accountId,
    };

    const created = await vehicleService.create(payload);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    const errorMsg = String(err.message || err);
    // Kiểm tra lỗi UNIQUE constraint cho VIN hoặc LicensePlate
    let friendlyMessage = "Lỗi khi thêm xe mới";
    if (errorMsg.includes('UNIQUE KEY constraint') && errorMsg.includes('VIN')) {
      friendlyMessage = "Số VIN này đã được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng chức năng chỉnh sửa nếu đây là xe của bạn.";
    } else if (errorMsg.includes('UNIQUE KEY constraint') && errorMsg.includes('LicensePlate')) {
      friendlyMessage = "Biển số này đã được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng chức năng chỉnh sửa nếu đây là xe của bạn.";
    } else if (errorMsg.includes('UNIQUE KEY constraint')) {
      friendlyMessage = "Thông tin xe này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại VIN hoặc biển số.";
    }
    
    return res.status(400).json({
      success: false,
      message: friendlyMessage,
      error: errorMsg
    });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const exists = await vehicleService.getById(id);
    if (!exists) return res.status(404).json({ success: false, message: "Không tìm thấy xe" });

    // Customer chỉ sửa xe của mình
    if (req.user?.role === "Customer") {
      const myAcc = getUserAccountId(req);
      if (exists.accountId !== myAcc) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền sửa xe này" });
      }
    }

    const payload = {
      ...req.body,
      AccountID: exists.accountId,
    };

    const updated = await vehicleService.update(id, payload);
    if (!updated) return res.status(400).json({ success: false, message: "Cập nhật thất bại" });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Lỗi cập nhật xe", error: String(err.message || err) });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ok = await vehicleService.remove(id);
    if (!ok) return res.status(404).json({ success: false, message: "Không tìm thấy xe hoặc xoá thất bại" });
    return res.json({ success: true, message: "Đã xoá xe" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi xoá xe", error: String(err.message || err) });
  }
};
// thêm ở cuối file
exports.getByVin = async (req, res) => {
  try {
    const vin = String(req.query.vin || "").trim().toUpperCase();
    if (!vin) return res.status(400).json({ success:false, message:"vin is required" });

    const vehicle = await vehicleRepository.getByVIN(vin);

    return res.json({ success:true, data: vehicle || null });
  } catch (e) {
    console.error('vehicleController.getByVin error:', e);
    res.status(500).json({ success:false, message:e.message });
  }
};
