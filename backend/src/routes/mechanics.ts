import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import {
  searchMechanics,
  getMechanicById,
  getMechanicByUserId,
  getMyMechanic,
  createMechanic,
  updateMechanic,
  updateMechanicStatus,
  getReviews,
  createReview,
} from '../controllers/mechanicsController'

const router = Router()

// ── Named routes FIRST — before any /:id routes ──────────────
router.get('/me',           authenticate, getMyMechanic)
router.get('/user/:userId', authenticate, getMechanicByUserId)

// ── Public param routes ───────────────────────────────────────
router.get('/',             searchMechanics)
router.get('/:id',          getMechanicById)
router.get('/:id/reviews',  getReviews)

// ── Authenticated ─────────────────────────────────────────────
router.post('/',            authenticate, createMechanic)
router.post('/:id/reviews', authenticate, createReview)
router.patch('/:id',        authenticate, updateMechanic)

// ── Admin ─────────────────────────────────────────────────────
router.patch('/:id/status', authenticate, requireAdmin, updateMechanicStatus)

export default router