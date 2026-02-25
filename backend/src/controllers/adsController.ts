import { Request, Response } from 'express'
import { z } from 'zod'
import { AdCampaign } from '../models/AdCampaign'
import { Advertiser } from '../models/Advertiser'
import { AuthRequest } from '../middleware/auth'

// ─── Validation schemas ───────────────────────────────────────

const createCampaignSchema = z.object({
  advertiserId:    z.string().min(1),
  name:            z.string().min(2),
  format:          z.enum(['banner', 'card', 'inline', 'spotlight']),
  placements:      z.array(z.string()).min(1),
  headline:        z.string().min(3),
  bodyText:        z.string().optional(),
  ctaLabel:        z.string().min(1),
  ctaUrl:          z.string().url(),
  imageUrl:        z.string().url().optional(),
  logoUrl:         z.string().url().optional(),
  backgroundColor: z.string().default('#1a1a2e'),
  accentColor:     z.string().default('#f97316'),
  targetCities:    z.array(z.string()).default([]),
  targetServices:  z.array(z.string()).default([]),
  startDate:       z.string().datetime({ offset: true }).or(z.string().date()),
  endDate:         z.string().datetime({ offset: true }).or(z.string().date()),
  priceNgn:        z.number().min(0),
  billingType:     z.enum(['flat', 'cpm', 'cpc']).default('flat'),
  cpmRate:         z.number().optional(),
  cpcRate:         z.number().optional(),
  budgetCap:       z.number().optional(),
})

const createAdvertiserSchema = z.object({
  businessName: z.string().min(2),
  contactName:  z.string().min(2),
  email:        z.string().email(),
  phone:        z.string().min(7),
  website:      z.string().url().optional(),
  industry:     z.string().optional(),
  notes:        z.string().optional(),
})

const campaignStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'approved', 'paused', 'rejected', 'expired', 'ended']),
})

// ─── Helpers ──────────────────────────────────────────────────

function serializeCampaign(c: Record<string, unknown>) {
  return { ...c, id: c._id, advertiser: c.advertiserId }
}

// ─── Public controllers ───────────────────────────────────────

export async function getAdsForPlacement(req: Request, res: Response): Promise<void> {
  try {
    const { placement } = req.params
    const { city, limit = '3' } = req.query
    const now = new Date()

    const filter: Record<string, unknown> = {
      status:     'active',
      placements: placement,
      startDate:  { $lte: now },
      endDate:    { $gte: now },
    }

    if (city) {
      filter.$or = [
        { targetCities: { $size: 0 } }, // national campaigns
        { targetCities: city },
      ]
    }

    const campaigns = await AdCampaign.find(filter)
      .populate('advertiserId', 'businessName email phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()

    res.json(campaigns.map(c => serializeCampaign(c as Record<string, unknown>)))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function trackImpression(req: Request, res: Response): Promise<void> {
  // Fire-and-forget — never return an error to the client
  AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { impressions: 1 } })
    .catch(err => console.error('Impression tracking error:', err))
  res.json({ ok: true })
}

export async function trackClick(req: Request, res: Response): Promise<void> {
  try {
    await AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { clicks: 1 } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ─── Admin: Campaigns ─────────────────────────────────────────

export async function getAllCampaigns(_req: Request, res: Response): Promise<void> {
  try {
    const campaigns = await AdCampaign.find()
      .populate('advertiserId', 'businessName email phone')
      .sort({ createdAt: -1 })
      .lean()
    res.json(campaigns.map(c => serializeCampaign(c as Record<string, unknown>)))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function createCampaign(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body     = createCampaignSchema.parse(req.body)
    const campaign = await AdCampaign.create({ ...body, status: 'pending', impressions: 0, clicks: 0 })
    res.status(201).json({ ...campaign.toObject(), id: campaign._id })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function updateCampaign(req: AuthRequest, res: Response): Promise<void> {
  try {
    const campaign = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return }
    res.json({ ...campaign.toObject(), id: campaign._id })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function updateCampaignStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status } = campaignStatusSchema.parse(req.body)
    const update: Record<string, unknown> = { status }

    if (status === 'active') {
      update.approvedBy = req.user!.userId
      update.approvedAt = new Date()
    }

    const campaign = await AdCampaign.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return }
    res.json({ success: true, status: campaign.status })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  try {
    const campaign = await AdCampaign.findByIdAndDelete(req.params.id)
    if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ─── Admin: Advertisers ───────────────────────────────────────

export async function getAllAdvertisers(_req: Request, res: Response): Promise<void> {
  try {
    const advertisers = await Advertiser.find().sort({ createdAt: -1 }).lean()
    res.json(advertisers.map(a => ({ ...a, id: a._id })))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function createAdvertiser(req: Request, res: Response): Promise<void> {
  try {
    const body       = createAdvertiserSchema.parse(req.body)
    const advertiser = await Advertiser.create(body)
    res.status(201).json({ ...advertiser.toObject(), id: advertiser._id })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function deleteAdvertiser(req: Request, res: Response): Promise<void> {
  try {
    const advertiser = await Advertiser.findByIdAndDelete(req.params.id)
    if (!advertiser) { res.status(404).json({ error: 'Advertiser not found' }); return }
    // Cascade delete all campaigns belonging to this advertiser
    await AdCampaign.deleteMany({ advertiserId: req.params.id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

// ─── Admin: Stats ─────────────────────────────────────────────

export async function getAdStats(_req: Request, res: Response): Promise<void> {
  try {
    const now        = new Date()
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
      revenue_this_month: monthRevenue[0]?.total         ?? 0,
      total_impressions:  campaigns.reduce((s, c) => s + c.impressions, 0),
      total_clicks:       campaigns.reduce((s, c) => s + c.clicks,      0),
      active_campaigns:   campaigns.filter(c => c.status === 'active').length,
      total_advertisers:  advertiserCount,
      pending_approval:   campaigns.filter(c => c.status === 'pending').length,
    })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}
