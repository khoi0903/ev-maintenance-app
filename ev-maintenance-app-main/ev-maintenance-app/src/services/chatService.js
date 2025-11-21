const chatRepository = require("../repositories/chatRepository");

class ChatService {
  async getMessages({ recipientId = null, currentUserId }) {
    if (!currentUserId) throw new Error("Thiếu ID người dùng hiện tại");
    return chatRepository.getMessages({ recipientId, currentUserId });
  }

  async sendMessage({ senderId, recipientId, message }) {
    if (!senderId) throw new Error("Thiếu ID người gửi");
    if (!recipientId) throw new Error("Thiếu ID người nhận");
    if (!message || !message.trim()) throw new Error("Nội dung tin nhắn không hợp lệ");

    const safeMessage = message.trim().slice(0, 1000);
    return chatRepository.createMessage({ senderId, recipientId, message: safeMessage });
  }
}

module.exports = new ChatService();
