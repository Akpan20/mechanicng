import { Router, Response } from 'express'
import { AdCampaign } from '../models/AdCampaign'
import { Advertiser } from '../models/Advertiser'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/ads/placement/:placement — public, for rendering
router.get('/placement/:placement', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { placement } = req.params
    const { city } = req.query
    const now = new Date()

    const filter: Record<string, unknown> = {
      status: 'active',
      placements: placement,
      startDate: { $lte: now },
      endDate:   { $gte: now },
    }
    if (city) filter.$or = [{ targetCities: { $size: 0 } }, { targetCities: city }]

    const campaigns = await AdCampaign.find(filter)
      .populate('advertiserId', 'businessName email phone')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()

    res.json(campaigns.map(c => ({ ...c, id: c._id, advertiser: c.advertiserId })))
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/ads/impression — fire-and-forget impression tracking
router.post('/impression', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { impressions: 1 } })
    res.json({ ok: true })
  } catch {
    res.json({ ok: false }) // never block the client
  }
})

// POST /api/ads/click — click tracking
router.post('/click', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { clicks: 1 } })
    res.json({ ok: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// ─── Admin routes ─────────────────────────────────────────────

// GET /api/ads/admin/campaigns
router.get('/admin/campaigns', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaigns = await AdCampaign.find()
      .populate('advertiserId', 'businessName email phone')
      .sort({ createdAt: -1 })
      .lean()
    res.json(campaigns.map(c => ({ ...c, id: c._id, advertiser: c.advertiserId })))
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/ads/admin/campaigns
router.post('/admin/campaigns', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaign = await AdCampaign.create({ ...req.body, status: 'pending', impressions: 0, clicks: 0 })
    res.status(201).json({ ...campaign.toObject(), id: campaign._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PATCH /api/ads/admin/campaigns/:id
router.patch('/admin/campaigns/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaign = await AdCampaign.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ ...campaign!.toObject(), id: campaign!._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PATCH /api/ads/admin/campaigns/:id/status
router.patch('/admin/campaigns/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    const update: Record<string, unknown> = { status }
    if (status === 'active') {
      update.approvedBy = req.user!.userId
      update.approvedAt = new Date()
    }
    await AdCampaign.findByIdAndUpdate(req.params.id, update)
    res.json({ success: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// DELETE /api/ads/admin/campaigns/:id
router.delete('/admin/campaigns/:id', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await AdCampaign.findByIdAndDelete(_req.params.id)
    res.json({ success: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/ads/admin/advertisers
router.get('/admin/advertisers', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const advertisers = await Advertiser.find().sort({ createdAt: -1 }).lean()
    res.json(advertisers.map(a => ({ ...a, id: a._id })))
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/ads/admin/advertisers
router.post('/admin/advertisers', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const advertiser = await Advertiser.create(req.body)
    res.status(201).json({ ...advertiser.toObject(), id: advertiser._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// DELETE /api/ads/admin/advertisers/:id
router.delete('/admin/advertisers/:id', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Advertiser.findByIdAndDelete(_req.params.id)
    await AdCampaign.deleteMany({ advertiserId: _req.params.id })
    res.json({ success: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/ads/admin/stats
router.get('/admin/stats', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const [campaigns, advertiserCount, monthRevenue] = await Promise.all([
      AdCampaign.find().lean(),
      Advertiser.countDocuments(),
      AdCampaign.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$priceNgn' } } },
      ]),
    ])
    res.json({
      revenue_this_month: monthRevenue[0]?.total ?? 0,
      total_impressions:  campaigns.reduce((s, c) => s + c.impressions, 0),
      total_clicks:       campaigns.reduce((s, c) => s + c.clicks, 0),
      active_campaigns:   campaigns.filter(c => c.status === 'active').length,
      total_advertisers:  advertiserCount,
      pending_approval:   campaigns.filter(c => c.status === 'pending').length,
    })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
