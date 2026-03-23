import { Request, Response } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import { Affiliate } from '../models/Affiliate'
import { Referral } from '../models/Referral'
import { AuthRequest } from '../middleware/auth'

// ─── Schemas ─────────────────────────────────────────────────

const registerSchema = z.object({
  fullName:      z.string().min(2).max(100),
  email:         z.string().email().max(254),
  bankName:      z.string().min(2).max(100).optional(),
  accountNumber: z.string().min(10).max(10).optional(),
  accountName:   z.string().min(2).max(100).optional(),
})

const bankSchema = z.object({
  bankName:      z.string().min(2).max(100),
  accountNumber: z.string().min(10).max(10),
  accountName:   z.string().min(2).max(100),
})

// ─── Helpers ─────────────────────────────────────────────────

function generateCode(fullName: string): string {
  const base    = fullName.replace(/\s+/g, '').toUpperCase().slice(0, 6)
  const suffix  = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${base}${suffix}`
}

// ─── Affiliate endpoints ──────────────────────────────────────

export async function registerAffiliate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const existing = await Affiliate.findOne({ userId: req.user!.userId })
    if (existing) {
      res.status(409).json({ error: 'You are already registered as an affiliate' })
      return
    }

    const body = registerSchema.parse(req.body)

    // Generate a unique code
    let code = generateCode(body.fullName)
    let attempts = 0
    while (await Affiliate.findOne({ code }) && attempts < 5) {
      code = generateCode(body.fullName)
      attempts++
    }

    const affiliate = await Affiliate.create({
      userId:         req.user!.userId,
      code,
      email:          body.email,
      fullName:       body.fullName,
      commissionRate: 0.20,
      bankName:       body.bankName,
      accountNumber:  body.accountNumber,
      accountName:    body.accountName,
    })

    res.status(201).json({
      id:             affiliate._id,
      code:           affiliate.code,
      commissionRate: affiliate.commissionRate,
      referralLink:   `${process.env.CLIENT_URL}/signup?ref=${affiliate.code}`,
    })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('registerAffiliate error:', err)
    res.status(500).json({ error: 'Failed to register as affiliate' })
  }
}

export async function getMyAffiliateStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user!.userId })
    if (!affiliate) { res.status(404).json({ error: 'Not registered as affiliate' }); return }

    const referrals = await Referral.find({ affiliateId: affiliate._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    res.json({
      id:             affiliate._id,
      code:           affiliate.code,
      fullName:       affiliate.fullName,
      email:          affiliate.email,
      commissionRate: affiliate.commissionRate,
      totalEarnings:  affiliate.totalEarnings,
      pendingPayout:  affiliate.pendingPayout,
      totalReferrals: affiliate.totalReferrals,
      status:         affiliate.status,
      bankName:       affiliate.bankName,
      accountNumber:  affiliate.accountNumber,
      accountName:    affiliate.accountName,
      referralLink:   `${process.env.CLIENT_URL}/signup?ref=${affiliate.code}`,
      recentReferrals: referrals.map(r => ({
        id:         r._id,
        plan:       r.plan,
        amountPaid: r.amountPaid,
        commission: r.commission,
        status:     r.status,
        createdAt:  r.createdAt,
      })),
    })
  } catch (err) {
    console.error('getMyAffiliateStats error:', err)
    res.status(500).json({ error: 'Failed to fetch affiliate stats' })
  }
}

export async function getMyReferrals(req: AuthRequest, res: Response): Promise<void> {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user!.userId })
    if (!affiliate) { res.status(404).json({ error: 'Not registered as affiliate' }); return }

    const page  = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10)

    const [referrals, total] = await Promise.all([
      Referral.find({ affiliateId: affiliate._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Referral.countDocuments({ affiliateId: affiliate._id }),
    ])

    res.json({
      referrals: referrals.map(r => ({
        id:         r._id,
        plan:       r.plan,
        amountPaid: r.amountPaid,
        commission: r.commission,
        status:     r.status,
        createdAt:  r.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('getMyReferrals error:', err)
    res.status(500).json({ error: 'Failed to fetch referrals' })
  }
}

export async function updateBankDetails(req: AuthRequest, res: Response): Promise<void> {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user!.userId })
    if (!affiliate) { res.status(404).json({ error: 'Not registered as affiliate' }); return }

    const body = bankSchema.parse(req.body)

    affiliate.bankName      = body.bankName
    affiliate.accountNumber = body.accountNumber
    affiliate.accountName   = body.accountName
    await affiliate.save()

    res.json({ message: 'Bank details updated successfully' })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    console.error('updateBankDetails error:', err)
    res.status(500).json({ error: 'Failed to update bank details' })
  }
}

// ─── Admin endpoints ──────────────────────────────────────────

export async function getAllAffiliates(_req: Request, res: Response): Promise<void> {
  try {
    const affiliates = await Affiliate.find()
      .sort({ totalEarnings: -1 })
      .lean()

    res.json(affiliates.map(a => ({
      id:             a._id,
      code:           a.code,
      fullName:       a.fullName,
      email:          a.email,
      commissionRate: a.commissionRate,
      totalEarnings:  a.totalEarnings,
      pendingPayout:  a.pendingPayout,
      totalReferrals: a.totalReferrals,
      status:         a.status,
      bankName:       a.bankName,
      accountNumber:  a.accountNumber,
      accountName:    a.accountName,
      createdAt:      a.createdAt,
    })))
  } catch (err) {
    console.error('getAllAffiliates error:', err)
    res.status(500).json({ error: 'Failed to fetch affiliates' })
  }
}

export async function markAsPaidOut(req: Request, res: Response): Promise<void> {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
    if (!affiliate) { res.status(404).json({ error: 'Affiliate not found' }); return }

    if (affiliate.pendingPayout === 0) {
      res.status(400).json({ error: 'No pending payout for this affiliate' })
      return
    }

    const amount = affiliate.pendingPayout

    // Mark all credited referrals as paid out
    await Referral.updateMany(
      { affiliateId: affiliate._id, status: 'credited' },
      { status: 'paid_out' }
    )

    affiliate.pendingPayout = 0
    await affiliate.save()

    res.json({ message: `Marked ₦${amount.toLocaleString()} as paid out to ${affiliate.fullName}` })
  } catch (err) {
    console.error('markAsPaidOut error:', err)
    res.status(500).json({ error: 'Failed to process payout' })
  }
}

export async function updateCommissionRate(req: Request, res: Response): Promise<void> {
  try {
    const { commissionRate } = req.body
    if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 1) {
      res.status(400).json({ error: 'Commission rate must be a number between 0 and 1' })
      return
    }

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { commissionRate },
      { new: true }
    )
    if (!affiliate) { res.status(404).json({ error: 'Affiliate not found' }); return }

    res.json({ message: `Commission rate updated to ${(commissionRate * 100).toFixed(0)}%` })
  } catch (err) {
    console.error('updateCommissionRate error:', err)
    res.status(500).json({ error: 'Failed to update commission rate' })
  }
}

export async function toggleAffiliateStatus(req: Request, res: Response): Promise<void> {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
    if (!affiliate) { res.status(404).json({ error: 'Affiliate not found' }); return }

    affiliate.status = affiliate.status === 'active' ? 'suspended' : 'active'
    await affiliate.save()

    res.json({ status: affiliate.status })
  } catch (err) {
    console.error('toggleAffiliateStatus error:', err)
    res.status(500).json({ error: 'Failed to update affiliate status' })
  }
}