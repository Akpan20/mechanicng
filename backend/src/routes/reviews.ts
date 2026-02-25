import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController'

// routes/reviews.ts
const router = Router()

// GET  /api/reviews/:mechanicId
router.get('/:mechanicId',  getReviews)

// POST /api/reviews/:mechanicId
router.post('/:mechanicId', authenticate, createReview)

// PATCH  /api/reviews/:reviewId
router.patch('/:reviewId',  authenticate, updateReview)

// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', authenticate, deleteReview)

export default router
