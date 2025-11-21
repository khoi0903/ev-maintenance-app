const notificationService = require('../services/notificationService');

exports.getAll = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    console.log('[notifications/getAll] Fetching notifications with limit:', limit);
    const userId = req.user?.accountId ?? null;
    const notifications = await notificationService.getAll(limit, userId);
    console.log('[notifications/getAll] Found', notifications?.length || 0, 'notifications');
    res.json({ success: true, data: notifications || [] });
  } catch (error) {
    console.error('[notifications/getAll] error:', error);
    res.status(500).json({ success: false, error: { code: 500, message: error.message || 'Server error' } });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[notifications/markAsRead] Marking notification', id, 'as read');
    const userId = req.user?.accountId
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 401, message: 'Unauthorized' } });
    }

    const ok = await notificationService.markAsRead(userId, id)
    if (!ok) {
      return res.status(500).json({ success: false, error: { code: 500, message: 'Failed to mark as read' } })
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('[notifications/markAsRead] error:', error);
    res.status(500).json({ success: false, error: { code: 500, message: error.message || 'Server error' } });
  }
};

