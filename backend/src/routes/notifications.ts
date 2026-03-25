// src/routes/notifications.ts
import { Router, Response } from 'express'
import { Notification } from '../models/Notification'
import { User }         from '../models/User'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// ── GET /api/notifications ─────────────────────────────────
// Current user's notifications, newest first
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const since  = req.query.since as string | undefined
    const filter: Record<string, unknown> = { user: req.user!.userId }  // adjust if your token uses `_id`
    if (since) filter.createdAt = { $gt: new Date(since) }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.json(notifications.map(n => ({
      id:        n._id,
      type:      n.type,
      title:     n.title,
      message:   n.message,
      read:      n.read,
      link:      n.link,
      createdAt: n.createdAt,
    })))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// ── PATCH /api/notifications/read-all ─────────────────────
// Must be before /:id to avoid route conflict
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { user: req.user!.userId, read: false },
      { read: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// ── PATCH /api/notifications/:id/read ─────────────────────
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.userId },
      { read: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// ── POST /api/notifications/send  (admin only) ─────────────
// Body:
//   target:  'all' | 'role' | 'user'
//   role?:   'user' | 'mechanic'          (when target === 'role')
//   userId?: string                        (when target === 'user')
//   type:    'info' | 'success' | 'warning' | 'error'
//   title:   string
//   message: string
//   link?:   string
router.post('/send', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { target, role, userId, type, title, message, link } = req.body

    if (!title?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'title and message are required' })
      return
    }

    // Resolve target user IDs
    let userIds: unknown[] = []

    if (target === 'all') {
      const users = await User.find({}, '_id').lean()
      userIds = users.map(u => u._id)

    } else if (target === 'role') {
      if (!['user', 'mechanic'].includes(role)) {
        res.status(400).json({ error: 'Invalid role. Must be user or mechanic.' })
        return
      }
      const users = await User.find({ role }, '_id').lean()
      userIds = users.map(u => u._id)

    } else if (target === 'user') {
      if (!userId) {
        res.status(400).json({ error: 'userId is required when target is user' })
        return
      }
      const user = await User.findById(userId, '_id').lean()
      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      userIds = [user._id]

    } else {
      res.status(400).json({ error: 'target must be all, role, or user' })
      return
    }

    if (userIds.length === 0) {
      res.status(404).json({ error: 'No users found for the given target' })
      return
    }

    // Bulk insert notifications
    await Notification.insertMany(
      userIds.map(uid => ({
        user:    uid,
        type:    type ?? 'info',
        title:   title.trim(),
        message: message.trim(),
        read:    false,
        ...(link ? { link } : {}),
      }))
    )

    res.json({ success: true, sent: userIds.length })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router