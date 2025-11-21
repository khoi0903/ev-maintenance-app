// controllers/modelController.js
const modelRepo = require("../repositories/modelRepository");

exports.list = async (req, res) => {
  try {
    const models = await modelRepo.getAll();
    res.json({ success: true, models }); // <-- FE đã parse được
  } catch (e) {
    res.status(500).json({ success:false, message:"Lỗi lấy model", error:e.message });
  }
};
