// backend/src/controllers/mechanicsController.ts (updated)

import { Request, Response } from 'express'
import { z } from 'zod'
import { Mechanic } from '../models/Mechanic'
import { Review } from '../models/Review'
import { AuditLog } from '../models/AuditLog'
import { AuthRequest } from '../middleware/auth'
import { geocodeAddress, geocodeCity } from '../lib/geo'   // <-- added

// Schema with optional lat/lng
const createMechanicSchema = z.object({
  name:          z.string().min(2).max(100),
  type:          z.enum(['shop', 'mobile']),
  phone:         z.string().min(7).max(20),
  whatsapp:      z.string().min(7).max(20),
  email:         z.string().email(),
  city:          z.string().min(2).max(100),
  area:          z.string().min(2).max(100),
  address:       z.string().max(200).optional(),
  lat:           z.number().min(-90).max(90).optional(),   // <-- optional
  lng:           z.number().min(-180).max(180).optional(), // <-- optional
  serviceRadius: z.number().min(0).max(500).optional(),
  services:      z.array(z.string().max(50)).min(1).max(20),
  hours:         z.string().min(2).max(100),
  priceRange:    z.enum(['low', 'mid', 'high']),
  bio:           z.string().max(1000).optional(),
})

const reviewSchema = z.object({
  userName: z.string().min(2).max(50),
  rating:   z.number().int().min(1).max(5),
  comment:  z.string().min(5).max(1000),
})

// ─── Helper to build a full address string ───────────────────
function buildAddressString(mechanic: {
  address?: string | null
  area?: string
  city: string
}): string {
  const parts = []
  if (mechanic.address) parts.push(mechanic.address)
  if (mechanic.area) parts.push(mechanic.area)
  if (mechanic.city) parts.push(mechanic.city)
  return parts.join(', ')
}

// ─── Serializer (unchanged) ──────────────────────────────────
function serializeMechanic(m: unknown, showContact = false) {
  const doc = m as Record<string, any>
  const { _id, __v, createdAt, updatedAt, reviewCount, location, ...rest } = doc
  const result: Record<string, any> = {
    ...rest,
    id:           _id,
    created_at:   createdAt,
    updated_at:   updatedAt,
    review_count: reviewCount,
    lat:          location?.coordinates?.[1] ?? null,
    lng:          location?.coordinates?.[0] ?? null,
  }
  if (!showContact) {
    delete result.phone
    delete result.whatsapp
    delete result.email
  }
  return result
}

// ─── Public endpoints ─────────────────────────────────────────

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
      const latN = Number(lat)
      const lngN = Number(lng)
      if (isNaN(latN) || isNaN(lngN) || latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
        res.status(400).json({ error: 'Invalid coordinates' }); return
      }
      // radius from query is in km; convert to meters for MongoDB
      const radiusMeters = Math.min(Number(radius ?? 50), 100) * 1000
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lngN, latN] },
          $maxDistance: radiusMeters,
        },
      }
    }

    const mechanics = await Mechanic.find(filter)
      .sort({ plan: -1, rating: -1 })
      .limit(100)
      .lean()

    const isAuth = !!(req as AuthRequest).user
    res.json(mechanics.map(m => serializeMechanic(m, isAuth)))
  } catch (err) {
    console.error('searchMechanics error:', err)
    res.status(500).json({ error: 'Failed to search mechanics' })
  }
}

export async function getMechanicById(req: Request, res: Response): Promise<void> {
  try {
    const m = await Mechanic.findById(req.params.id).lean()
    if (!m) { res.status(404).json({ error: 'Mechanic not found' }); return }
    res.json(serializeMechanic(m, true))
  } catch (err) {
    console.error('getMechanicById error:', err)
    res.status(500).json({ error: 'Failed to fetch mechanic' })
  }
}

export async function getMechanicByUserId(req: AuthRequest, res: Response): Promise<void> {
  try {
    const m = await Mechanic.findOne({ userId: req.params.userId }).lean()
    if (!m) { res.status(404).json({ error: 'No listing found for this user' }); return }
    res.json(serializeMechanic(m, true))
  } catch (err) {
    console.error('getMechanicByUserId error:', err)
    res.status(500).json({ error: 'Failed to fetch mechanic' })
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
    let { lat, lng, ...rest } = parsed

    // Prevent duplicate listings per user
    const existing = await Mechanic.findOne({ userId: req.user!.userId })
    if (existing) {
      res.status(409).json({ error: 'You already have a mechanic listing' }); return
    }

    // If coordinates not provided, try to geocode from address
    if (lat === undefined || lng === undefined) {
      const addressStr = buildAddressString({ address: rest.address, area: rest.area, city: rest.city })
      let coords = null
      if (addressStr) {
        coords = await geocodeAddress(addressStr)
      }
      if (!coords && rest.city) {
        coords = await geocodeCity(rest.city)
      }
      if (coords) {
        lat = coords.lat
        lng = coords.lng
      } else {
        res.status(400).json({
          error: 'Could not determine location from address. Please select a location on the map.',
        })
        return
      }
    }

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

    res.status(201).json(serializeMechanic(mechanic.toObject(), true))
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('createMechanic error:', err)
    res.status(500).json({ error: 'Failed to create mechanic listing' })
  }
}

export async function updateMechanic(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mechanic = await Mechanic.findById(req.params.id)
    if (!mechanic) { res.status(404).json({ error: 'Mechanic not found' }); return }

    const isOwner = mechanic.userId.toString() === req.user!.userId
    const isAdmin = req.user!.role === 'admin'

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Forbidden' }); return
    }

    const body = { ...req.body }

    // Normalize snake_case from frontend forms
    if (body.price_range && !body.priceRange) {
      body.priceRange = body.price_range
      delete body.price_range
    }

    // Check undefined BEFORE passing to isNaN — fixes TS2345
    const lat = body.lat != null ? parseFloat(body.lat) : undefined
    const lng = body.lng != null ? parseFloat(body.lng) : undefined

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        res.status(400).json({ error: 'Invalid coordinates' }); return
      }
      body.location = { type: 'Point', coordinates: [lng, lat] }
      delete body.lat
      delete body.lng
    } else {
      // No coordinates provided: check if address fields changed
      const addressFields = ['address', 'area', 'city']
      // Cast mechanic to any for dynamic string indexing — fixes TS7053
      const addressChanged = addressFields.some(
        field => body[field] !== undefined && body[field] !== (mechanic as any)[field]
      )
      if (addressChanged) {
        const newAddress = {
          address: body.address ?? mechanic.address,
          area:    body.area    ?? mechanic.area,
          city:    body.city    ?? mechanic.city,
        }
        const addressStr = buildAddressString(newAddress)
        let coords = null
        if (addressStr) coords = await geocodeAddress(addressStr)
        if (!coords && newAddress.city) coords = await geocodeCity(newAddress.city)
        if (coords) {
          body.location = { type: 'Point', coordinates: [coords.lng, coords.lat] }
        } else {
          res.status(400).json({
            error: 'Could not determine new location from address. Please select a location on the map.',
          }); return
        }
      }
    }

    // Whitelist allowed fields
    const allowedFields = [
      'name', 'type', 'phone', 'whatsapp', 'email', 'city', 'area',
      'address', 'location', 'serviceRadius', 'services', 'hours',
      'priceRange', 'bio', 'photos',
    ]
    if (isAdmin) allowedFields.push('plan')

    Object.keys(body).forEach(key => {
      if (!allowedFields.includes(key)) delete body[key]
    })

    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' }); return
    }

    if (isAdmin && !isOwner) {
      await AuditLog.create({
        adminId:    req.user!.userId,
        action:     'edit_mechanic',
        targetId:   req.params.id,
        targetType: 'mechanic',
        before:     mechanic.toObject(),
        after:      body,
        ip:         req.ip,
      })
    }

    Object.assign(mechanic, body)
    await mechanic.save()
    res.json(serializeMechanic(mechanic.toObject(), isOwner || isAdmin))
  } catch (err) {
    console.error('updateMechanic error:', err)
    res.status(500).json({ error: 'Failed to update mechanic' })
  }
}

// ─── Admin (unchanged) ───────────────────────────────────────

export async function getAllMechanicsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1)
    const limit  = Math.min(50, parseInt(req.query.limit as string) || 12)
    const status = req.query.status as string | undefined
    const city   = req.query.city   as string | undefined

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (city)   filter.$or = [
      { city: new RegExp(city, 'i') },
      { name: new RegExp(city, 'i') },
    ]

    const [mechanics, total] = await Promise.all([
      Mechanic.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Mechanic.countDocuments(filter),
    ])

    res.json({
      mechanics:  mechanics.map(m => serializeMechanic(m, true)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('getAllMechanicsAdmin error:', err)
    res.status(500).json({ error: 'Failed to fetch mechanics' })
  }
}

export async function updateMechanicStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body
    const allowed = ['pending', 'approved', 'rejected', 'suspended']
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` }); return
    }

    const before = await Mechanic.findById(req.params.id)
    if (!before) { res.status(404).json({ error: 'Mechanic not found' }); return }

    const m = await Mechanic.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    await AuditLog.create({
      adminId:    (req as AuthRequest).user!.userId,
      action:     `${status}_mechanic`,
      targetId:   req.params.id,
      targetType: 'mechanic',
      before:     { status: before.status },
      after:      { status },
      ip:         req.ip,
    })

    res.json({ success: true, status: m!.status })
  } catch (err) {
    console.error('updateMechanicStatus error:', err)
    res.status(500).json({ error: 'Failed to update mechanic status' })
  }
}

// ─── Reviews (unchanged) ─────────────────────────────────────

export async function getReviews(req: Request, res: Response): Promise<void> {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
    const limit = Math.min(20, parseInt(req.query.limit as string) || 5)

    const [reviews, total] = await Promise.all([
      Review.find({ mechanicId: req.params.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments({ mechanicId: req.params.id }),
    ])

    res.json({
      reviews:    reviews.map(r => ({ ...r, id: r._id })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('getReviews error:', err)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
}

export async function createReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mechanic = await Mechanic.findById(req.params.id)
    if (!mechanic) { res.status(404).json({ error: 'Mechanic not found' }); return }
    if (mechanic.userId.toString() === req.user!.userId) {
      res.status(403).json({ error: 'You cannot review your own listing' }); return
    }

    const body = reviewSchema.parse(req.body)

    const existing = await Review.findOne({ mechanicId: req.params.id, userId: req.user!.userId })
    if (existing) {
      res.status(409).json({ error: 'You have already reviewed this mechanic' }); return
    }

    const review = await Review.create({
      mechanicId: req.params.id,
      userId:     req.user!.userId,
      ...body,
    })

    const all = await Review.find({ mechanicId: req.params.id })
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length
    await Mechanic.findByIdAndUpdate(req.params.id, {
      rating:      Math.round(avg * 10) / 10,
      reviewCount: all.length,
    })

    res.status(201).json({ ...review.toObject(), id: review._id })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('createReview error:', err)
    res.status(500).json({ error: 'Failed to submit review' })
  }
}