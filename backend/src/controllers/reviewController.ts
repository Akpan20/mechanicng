import { Response } from 'express'
import mongoose from 'mongoose'
import { Review }   from '../models/Review'
import { Mechanic } from '../models/Mechanic'
import { User }     from '../models/User'
import { AuthRequest } from '../middleware/auth'

// ── Helper ────────────────────────────────────────────────────

async function recalculateMechanicRating(mechanicId: string): Promise<void> {
  const allReviews  = await Review.find({ mechanicId: new mongoose.Types.ObjectId(mechanicId) })
  const reviewCount = allReviews.length
  const rating      = reviewCount > 0
    ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : 0

  await Mechanic.findByIdAndUpdate(mechanicId, { rating, reviewCount }, { new: true })
}

// ── GET /api/reviews/:mechanicId ──────────────────────────────

export async function getReviews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { mechanicId } = req.params   // ← matches /:mechanicId
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10)
    const skip  = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      Review.find({ mechanicId: new mongoose.Types.ObjectId(mechanicId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ mechanicId: new mongoose.Types.ObjectId(mechanicId) }),
    ])

    res.json({
      reviews:    reviews.map(r => ({ ...r, id: r._id })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ── POST /api/reviews/:mechanicId ─────────────────────────────

export async function createReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { mechanicId } = req.params   // ← matches /:mechanicId
    const { rating, comment } = req.body

    if (!rating || !comment) {
      res.status(400).json({ error: 'rating and comment are required' })
      return
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'rating must be between 1 and 5' })
      return
    }

    // Derive userName from DB — never trust the client
    const user     = await User.findById(req.user!.userId).lean()
    const userName = user?.fullName || req.user!.email || 'Anonymous'

    const existing = await Review.findOne({
      mechanicId: new mongoose.Types.ObjectId(mechanicId),
      userId:     new mongoose.Types.ObjectId(req.user!.userId),
    })
    if (existing) {
      res.status(409).json({ error: 'You have already reviewed this mechanic' })
      return
    }

    const review = await Review.create({
      mechanicId: new mongoose.Types.ObjectId(mechanicId),
      userId:     new mongoose.Types.ObjectId(req.user!.userId),
      userName,
      rating,
      comment,
    })

    await recalculateMechanicRating(mechanicId)

    res.status(201).json({ ...review.toObject(), id: review._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ── PATCH /api/reviews/:reviewId ──────────────────────────────

export async function updateReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { reviewId } = req.params
    const { rating, comment } = req.body

    const review = await Review.findById(reviewId)
    if (!review) {
      res.status(404).json({ error: 'Review not found' })
      return
    }

    if (review.userId.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        res.status(400).json({ error: 'rating must be between 1 and 5' })
        return
      }
      review.rating = rating
    }
    if (comment !== undefined) review.comment = comment

    await review.save()
    await recalculateMechanicRating(review.mechanicId.toString())

    res.json({ ...review.toObject(), id: review._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ── DELETE /api/reviews/:reviewId ─────────────────────────────

export async function deleteReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { reviewId } = req.params

    const review = await Review.findById(reviewId)
    if (!review) {
      res.status(404).json({ error: 'Review not found' })
      return
    }

    if (review.userId.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const mechanicId = review.mechanicId.toString()
    await review.deleteOne()
    await recalculateMechanicRating(mechanicId)

    res.json({ success: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
}