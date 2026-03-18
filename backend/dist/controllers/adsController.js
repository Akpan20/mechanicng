"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdsForPlacement = getAdsForPlacement;
exports.trackImpression = trackImpression;
exports.trackClick = trackClick;
exports.getAllCampaigns = getAllCampaigns;
exports.createCampaign = createCampaign;
exports.updateCampaign = updateCampaign;
exports.updateCampaignStatus = updateCampaignStatus;
exports.deleteCampaign = deleteCampaign;
exports.getAllAdvertisers = getAllAdvertisers;
exports.createAdvertiser = createAdvertiser;
exports.deleteAdvertiser = deleteAdvertiser;
exports.getAdStats = getAdStats;
const zod_1 = require("zod");
const AdCampaign_1 = require("../models/AdCampaign");
const Advertiser_1 = require("../models/Advertiser");
// ─── Validation schemas ───────────────────────────────────────
const createCampaignSchema = zod_1.z.object({
    advertiserId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(2),
    format: zod_1.z.enum(['banner', 'card', 'inline', 'spotlight']),
    placements: zod_1.z.array(zod_1.z.string()).min(1),
    headline: zod_1.z.string().min(3),
    bodyText: zod_1.z.string().optional(),
    ctaLabel: zod_1.z.string().min(1),
    ctaUrl: zod_1.z.string().url(),
    imageUrl: zod_1.z.string().url().optional(),
    logoUrl: zod_1.z.string().url().optional(),
    backgroundColor: zod_1.z.string().default('#1a1a2e'),
    accentColor: zod_1.z.string().default('#f97316'),
    targetCities: zod_1.z.array(zod_1.z.string()).default([]),
    targetServices: zod_1.z.array(zod_1.z.string()).default([]),
    startDate: zod_1.z.string().datetime({ offset: true }).or(zod_1.z.string().date()),
    endDate: zod_1.z.string().datetime({ offset: true }).or(zod_1.z.string().date()),
    priceNgn: zod_1.z.number().min(0),
    billingType: zod_1.z.enum(['flat', 'cpm', 'cpc']).default('flat'),
    cpmRate: zod_1.z.number().optional(),
    cpcRate: zod_1.z.number().optional(),
    budgetCap: zod_1.z.number().optional(),
});
const createAdvertiserSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2),
    contactName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(7),
    website: zod_1.z.string().url().optional(),
    industry: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const campaignStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'active', 'approved', 'paused', 'rejected', 'expired', 'ended']),
});
// ─── Helpers ──────────────────────────────────────────────────
function serializeCampaign(c) {
    return { ...c, id: c._id, advertiser: c.advertiserId };
}
// ─── Public controllers ───────────────────────────────────────
async function getAdsForPlacement(req, res) {
    try {
        const { placement } = req.params;
        const { city, limit = '3' } = req.query;
        const now = new Date();
        const filter = {
            status: 'active',
            placements: placement,
            startDate: { $lte: now },
            endDate: { $gte: now },
        };
        if (city) {
            filter.$or = [
                { targetCities: { $size: 0 } }, // national campaigns
                { targetCities: city },
            ];
        }
        const campaigns = await AdCampaign_1.AdCampaign.find(filter)
            .populate('advertiserId', 'businessName email phone')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();
        res.json(campaigns.map(c => serializeCampaign(c)));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function trackImpression(req, res) {
    // Fire-and-forget — never return an error to the client
    AdCampaign_1.AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { impressions: 1 } })
        .catch(err => console.error('Impression tracking error:', err));
    res.json({ ok: true });
}
async function trackClick(req, res) {
    try {
        await AdCampaign_1.AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { clicks: 1 } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ─── Admin: Campaigns ─────────────────────────────────────────
async function getAllCampaigns(_req, res) {
    try {
        const campaigns = await AdCampaign_1.AdCampaign.find()
            .populate('advertiserId', 'businessName email phone')
            .sort({ createdAt: -1 })
            .lean();
        res.json(campaigns.map(c => serializeCampaign(c)));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function createCampaign(req, res) {
    try {
        const body = createCampaignSchema.parse(req.body);
        const campaign = await AdCampaign_1.AdCampaign.create({ ...body, status: 'pending', impressions: 0, clicks: 0 });
        res.status(201).json({ ...campaign.toObject(), id: campaign._id });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
}
async function updateCampaign(req, res) {
    try {
        const campaign = await AdCampaign_1.AdCampaign.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
        if (!campaign) {
            res.status(404).json({ error: 'Campaign not found' });
            return;
        }
        res.json({ ...campaign.toObject(), id: campaign._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateCampaignStatus(req, res) {
    try {
        const { status } = campaignStatusSchema.parse(req.body);
        const update = { status };
        if (status === 'active') {
            update.approvedBy = req.user.userId;
            update.approvedAt = new Date();
        }
        const campaign = await AdCampaign_1.AdCampaign.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!campaign) {
            res.status(404).json({ error: 'Campaign not found' });
            return;
        }
        res.json({ success: true, status: campaign.status });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
}
async function deleteCampaign(req, res) {
    try {
        const campaign = await AdCampaign_1.AdCampaign.findByIdAndDelete(req.params.id);
        if (!campaign) {
            res.status(404).json({ error: 'Campaign not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ─── Admin: Advertisers ───────────────────────────────────────
async function getAllAdvertisers(_req, res) {
    try {
        const advertisers = await Advertiser_1.Advertiser.find().sort({ createdAt: -1 }).lean();
        res.json(advertisers.map(a => ({ ...a, id: a._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function createAdvertiser(req, res) {
    try {
        const body = createAdvertiserSchema.parse(req.body);
        const advertiser = await Advertiser_1.Advertiser.create(body);
        res.status(201).json({ ...advertiser.toObject(), id: advertiser._id });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
}
async function deleteAdvertiser(req, res) {
    try {
        const advertiser = await Advertiser_1.Advertiser.findByIdAndDelete(req.params.id);
        if (!advertiser) {
            res.status(404).json({ error: 'Advertiser not found' });
            return;
        }
        // Cascade delete all campaigns belonging to this advertiser
        await AdCampaign_1.AdCampaign.deleteMany({ advertiserId: req.params.id });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ─── Admin: Stats ─────────────────────────────────────────────
async function getAdStats(_req, res) {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [campaigns, advertiserCount, monthRevenue] = await Promise.all([
            AdCampaign_1.AdCampaign.find().lean(),
            Advertiser_1.Advertiser.countDocuments(),
            AdCampaign_1.AdCampaign.aggregate([
                { $match: { createdAt: { $gte: monthStart } } },
                { $group: { _id: null, total: { $sum: '$priceNgn' } } },
            ]),
        ]);
        res.json({
            revenue_this_month: monthRevenue[0]?.total ?? 0,
            total_impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
            total_clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
            active_campaigns: campaigns.filter(c => c.status === 'active').length,
            total_advertisers: advertiserCount,
            pending_approval: campaigns.filter(c => c.status === 'pending').length,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
