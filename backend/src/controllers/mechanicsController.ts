import { Request, Response } from 'express'
import { z } from 'zod'
import { Mechanic } from '../models/Mechanic'
import { Review } from '../models/Review'
import { AuthRequest } from '../middleware/auth'

const createMechanicSchema = z.object({
  name:          z.string().min(2),
  type:          z.enum(['shop', 'mobile']),
  phone:         z.string().min(7),
  whatsapp:      z.string().min(7),
  email:         z.string().email(),
  city:          z.string().min(2),
  area:          z.string().min(2),
  address:       z.string().optional(),
  lat:           z.number(),
  lng:           z.number(),
  serviceRadius: z.number().optional(),
  services:      z.array(z.string()).min(1),
  hours:         z.string().min(2),
  priceRange:    z.enum(['low', 'mid', 'high']),
  bio:           z.string().optional(),
})

const reviewSchema = z.object({
  userName: z.string().min(2),
  rating:   z.number().int().min(1).max(5),
  comment:  z.string().min(5),
})

// Single cast point — all callers pass toObject() or lean() results here
function serializeMechanic(m: unknown) {
  const doc = m as Record<string, any>
  const { _id, __v, createdAt, updatedAt, reviewCount, location, ...rest } = doc
  return {
    ...rest,
    id:           _id,
    created_at:   createdAt,
    updated_at:   updatedAt,
    review_count: reviewCount,
    lat: location?.coordinates?.[1] ?? null,
    lng: location?.coordinates?.[0] ?? null,
  }
}

export async function searchMechanics(req: Request, res: Response): Promise<void> {
  try {
    const { city, service, type, priceRange, minRating, lat, lng, radius } = req.query
    const filter: Record<string, unknown> = { status: 'approved' }

    if (city)       filter.$or = [
      { city: new RegExp(city as string, 'i') },
      { area: new RegExp(city as string, 'i') },
    ]
    if (service)    filter.services   = service
    if (type)       filter.type       = type
    if (priceRange) filter.priceRange = priceRange
    if (minRating)  filter.rating     = { $gte: Number(minRating) }

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

    res.json(mechanics.map(serializeMechanic))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function getMechanicById(req: Request, res: Response): Promise<void> {
  try {
    const m = await Mechanic.findById(req.params.id).lean()
    if (!m) { res.status(404).json({ error: 'Mechanic not found' }); return }
    res.json(serializeMechanic(m))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function getMechanicByUserId(req: AuthRequest, res: Response): Promise<void> {
  try {
    const m = await Mechanic.findOne({ userId: req.params.userId }).lean()
    if (!m) { res.status(404).json({ error: 'No listing found for this user' }); return }
    res.json(serializeMechanic(m))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function createMechanic(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = { ...req.body }

    // Normalize snake_case from frontend forms
    if (body.price_range && !body.priceRange) {
      body.priceRange = body.price_range
      delete body.price_range
    }

    const parsed = createMechanicSchema.parse(body)
    const { lat, lng, ...rest } = parsed

    const mechanic = await Mechanic.create({
      ...rest,
      userId:      req.user!.userId,
      location:    { type: 'Point', coordinates: [lng, lat] },
      status:      'pending',
      rating:      0,
      reviewCount: 0,
      verified:    false,
      featured:    false,
      photos:      [],
    })

    res.status(201).json(serializeMechanic(mechanic.toObject()))
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function updateMechanic(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mechanic = await Mechanic.findById(req.params.id)
    if (!mechanic) { res.status(404).json({ error: 'Mechanic not found' }); return }

    const isOwner = mechanic.userId.toString() === req.user!.userId
    if (!isOwner && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' }); return
    }

    const body = { ...req.body }

    // Normalize snake_case from frontend forms
    if (body.price_range && !body.priceRange) {
      body.priceRange = body.price_range
      delete body.price_range
    }
    if (body.lat != null && body.lng != null) {
      body.location = { type: 'Point', coordinates: [body.lng, body.lat] }
      delete body.lat
      delete body.lng
    }

    // Prevent overwriting protected fields
    const protected_ = ['status', 'rating', 'reviewCount', 'verified', 'featured', 'userId']
    protected_.forEach(f => delete body[f])

    Object.assign(mechanic, body)
    await mechanic.save()
    res.json(serializeMechanic(mechanic.toObject()))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ─── Admin ────────────────────────────────────────────────────

export async function getAllMechanicsAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const mechanics = await Mechanic.find().sort({ createdAt: -1 }).lean()
    res.json(mechanics.map(serializeMechanic))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function updateMechanicStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body
    const allowed = ['pending', 'approved', 'rejected', 'suspended']
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` }); return
    }
    const m = await Mechanic.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!m) { res.status(404).json({ error: 'Mechanic not found' }); return }
    res.json({ success: true, status: m.status })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ─── Reviews ──────────────────────────────────────────────────

export async function getReviews(req: Request, res: Response): Promise<void> {
  try {
    const reviews = await Review.find({ mechanicId: req.params.id })
      .sort({ createdAt: -1 })
      .lean()
    res.json(reviews.map(r => ({ ...r, id: r._id })))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function createReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = reviewSchema.parse(req.body)

    // Prevent duplicate reviews from same user
    const existing = await Review.findOne({ mechanicId: req.params.id, userId: req.user!.userId })
    if (existing) {
      res.status(409).json({ error: 'You have already reviewed this mechanic' }); return
    }

    const review = await Review.create({
      mechanicId: req.params.id,
      userId:     req.user!.userId,
      ...body,
    })

    // Recalculate average rating
    const all = await Review.find({ mechanicId: req.params.id })
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length
    await Mechanic.findByIdAndUpdate(req.params.id, {
      rating:      Math.round(avg * 10) / 10,
      reviewCount: all.length,
    })

    res.status(201).json({ ...review.toObject(), id: review._id })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}