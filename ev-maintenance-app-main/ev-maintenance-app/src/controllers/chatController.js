const chatService = require("../services/chatService");

exports.getMessages = async (req, res) => {
  try {
    const { recipientId } = req.query;
    const messages = await chatService.getMessages({
      recipientId: recipientId ? parseInt(recipientId) : null,
      currentUserId: req.user.id,
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ success: false, message: err.message || "Lỗi lấy tin nhắn" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const msg = await chatService.sendMessage({
      senderId: req.user.id,
      recipientId,
      message,
    });
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(400).json({ success: false, message: err.message || "Lỗi gửi tin nhắn" });
  }
};
