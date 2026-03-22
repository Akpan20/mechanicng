import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import {
  searchMechanics,
  getMechanicById,
  getMechanicByUserId,
  createMechanic,
  updateMechanic,
  updateMechanicStatus,
  getReviews,
  createReview,
} from '../controllers/mechanicsController'

const router = Router()

// Public
router.get('/',           searchMechanics)
router.get('/:id',        getMechanicById)
router.get('/:id/reviews', getReviews)

// Authenticated
router.get('/user/:userId', authenticate, getMechanicByUserId)
router.post('/',            authenticate, createMechanic)
router.post('/:id/reviews', authenticate, createReview)
router.patch('/:id',        authenticate, updateMechanic)

// Admin
router.patch('/:id/status', authenticate, requireAdmin, updateMechanicStatus)

export default router