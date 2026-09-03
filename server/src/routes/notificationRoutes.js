const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();
router.use(protect);

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { owner: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ owner: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, notifications, total, unreadCount, page: Number(page) });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ owner: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
