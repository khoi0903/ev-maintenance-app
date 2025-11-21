const { poolPromise, sql } = require("../db");

class ChatRepository {
  // 🔹 Lấy tin nhắn
  async getMessages({ recipientId = null, currentUserId }) {
    const pool = await poolPromise;
    const req = pool.request();

    let where = "";
    if (recipientId) {
      req.input("Me", sql.Int, currentUserId);
      req.input("Other", sql.Int, recipientId);
      where = `
        WHERE (FromAccountID = @Me AND ToAccountID = @Other)
           OR (FromAccountID = @Other AND ToAccountID = @Me)
      `;
    } else {
      req.input("Me", sql.Int, currentUserId);
      where = `WHERE FromAccountID = @Me OR ToAccountID = @Me`;
    }

    const query = `
      SELECT MessageID, FromAccountID, ToAccountID, Message, SentTime
      FROM ChatMessage
      ${where}
      ORDER BY SentTime ASC
    `;

    const result = await req.query(query);
    return result.recordset;
  }

  // 🔹 Gửi tin nhắn
  async createMessage({ senderId, recipientId, message }) {
    const pool = await poolPromise;
    const r = await pool.request()
      .input("FromAccountID", sql.Int, senderId)
      .input("ToAccountID", sql.Int, recipientId)
      .input("Message", sql.NVarChar(1000), message)
      .query(`
        INSERT INTO ChatMessage (FromAccountID, ToAccountID, Message, SentTime)
        OUTPUT INSERTED.*
        VALUES (@FromAccountID, @ToAccountID, @Message, SYSUTCDATETIME())
      `);
    return r.recordset[0];
  }
}

module.exports = new ChatRepository();
