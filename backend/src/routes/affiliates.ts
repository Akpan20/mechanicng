import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import {
  registerAffiliate,
  getMyAffiliateStats,
  getMyReferrals,
  updateBankDetails,
  getAllAffiliates,
  markAsPaidOut,
  updateCommissionRate,
  toggleAffiliateStatus,
} from '../controllers/affiliateController'

const router = Router()

// ── Affiliate (authenticated) ─────────────────────────────────
router.post('/',              authenticate, registerAffiliate)
router.get('/me',             authenticate, getMyAffiliateStats)
router.get('/me/referrals',   authenticate, getMyReferrals)
router.patch('/bank-details', authenticate, updateBankDetails)

// ── Admin ─────────────────────────────────────────────────────
router.get('/',                          authenticate, requireAdmin, getAllAffiliates)
router.post('/:id/payout',               authenticate, requireAdmin, markAsPaidOut)
router.patch('/:id/commission',          authenticate, requireAdmin, updateCommissionRate)
router.patch('/:id/toggle-status',       authenticate, requireAdmin, toggleAffiliateStatus)

export default router