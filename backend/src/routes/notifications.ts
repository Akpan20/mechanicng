import { Router } from 'express';
import { Notification } from '../models/Notification';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { limit = 50, since } = req.query;
    const userId = req.user._id;

    const query: any = { user: userId };
    if (since) {
      query.createdAt = { $gte: new Date(since as string) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;