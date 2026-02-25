import { Router, Response } from 'express'
import mongoose from 'mongoose'
import { Mechanic } from '../models/Mechanic'
import { Review } from '../models/Review'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/mechanics — public search
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, service, type, priceRange, minRating, lat, lng, radius } = req.query
    const filter: Record<string, unknown> = { status: 'approved' }

    if (city)       filter.$or = [{ city: new RegExp(city as string, 'i') }, { area: new RegExp(city as string, 'i') }]
    if (service)    filter.services = service
    if (type)       filter.type = type
    if (priceRange) filter.priceRange = priceRange
    if (minRating)  filter.rating = { $gte: Number(minRating) }

    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius ?? 50000),
        },
      }
    }

    const mechanics = await Mechanic.find(filter)
      .sort({ plan: -1, rating: -1 })
      .limit(100)
      .lean()

    res.json(mechanics.map(m => ({ ...m, id: m._id })))
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// ── Named routes MUST come before /:id ───────────────────────

// GET /api/mechanics/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('req.user:', req.user)
    
    const m = await Mechanic.findOne({
      userId: new mongoose.Types.ObjectId(req.user!.userId)
    }).lean()
    
    console.log('found mechanic:', m)
    
    if (!m) { res.status(404).json({ error: 'No listing found' }); return }
    res.json({ ...m, id: m._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/mechanics/admin/all
router.get('/admin/all', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mechanics = await Mechanic.find().sort({ createdAt: -1 }).lean()
    res.json(mechanics.map(m => ({ ...m, id: m._id })))
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/mechanics/user/:userId
// GET /user/:userId
router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const m = await Mechanic.findOne({
      userId: new mongoose.Types.ObjectId(req.params.userId)
    }).lean()
    if (!m) { res.status(404).json({ error: 'Not found' }); return }
    res.json({ ...m, id: m._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// ── Param routes AFTER all named routes ──────────────────────

// GET /api/mechanics/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const m = await Mechanic.findById(req.params.id).lean()
    if (!m) { res.status(404).json({ error: 'Mechanic not found' }); return }
    res.json({ ...m, id: m._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/mechanics
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body

    if (!body.priceRange || !['low', 'mid', 'high'].includes(body.priceRange)) {
      res.status(400).json({ error: 'priceRange is required and must be low, mid, or high' })
      return
    }

    const mechanic = await Mechanic.create({
      ...body,
      userId: req.user!.userId,
      location: { type: 'Point', coordinates: [body.lng, body.lat] },
      status: 'pending',
      rating: 0,
      reviewCount: 0,
      verified: false,
      featured: false,
      photos: [],
    })

    res.status(201).json({ ...mechanic.toObject(), id: mechanic._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PATCH /api/mechanics/:id/status  — must be before /:id PATCH
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    await Mechanic.findByIdAndUpdate(req.params.id, { status })
    res.json({ success: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PATCH /api/mechanics/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mechanic = await Mechanic.findById(req.params.id)
    if (!mechanic) { res.status(404).json({ error: 'Not found' }); return }
    if (mechanic.userId.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' }); return
    }
    const body = req.body
    if (body.lat && body.lng) {
      body.location = { type: 'Point', coordinates: [body.lng, body.lat] }
    }
    Object.assign(mechanic, body)
    await mechanic.save()
    res.json({ ...mechanic.toObject(), id: mechanic._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// ── Reviews ───────────────────────────────────────────────────

// GET /api/mechanics/:id/reviews
router.get('/:id/reviews', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ mechanicId: req.params.id }).sort({ createdAt: -1 }).lean()
    res.json(reviews.map(r => ({ ...r, id: r._id })))
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/mechanics/:id/reviews
router.post('/:id/reviews', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.create({
      mechanicId: req.params.id,
      userId: req.user!.userId,
      userName: req.body.userName,
      rating: req.body.rating,
      comment: req.body.comment,
    })
    const allReviews = await Review.find({ mechanicId: req.params.id })
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await Mechanic.findByIdAndUpdate(req.params.id, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    })
    res.status(201).json({ ...review.toObject(), id: review._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router