const eventService = require('../services/eventService');

exports.getRecent = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    console.log('[events/getRecent] Fetching events with limit:', limit);
    const events = await eventService.getRecent(limit);
    console.log('[events/getRecent] Found', events?.length || 0, 'events');
    res.json({ success: true, data: events || [] });
  } catch (error) {
    console.error('[events/getRecent] error:', error);
    res.status(500).json({ success: false, error: { code: 500, message: error.message || 'Server error' } });
  }
};

