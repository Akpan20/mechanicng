"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdCampaign_1 = require("../models/AdCampaign");
const Advertiser_1 = require("../models/Advertiser");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/ads/placement/:placement — public, for rendering
router.get('/placement/:placement', async (req, res) => {
    try {
        const { placement } = req.params;
        const { city } = req.query;
        const now = new Date();
        const filter = {
            status: 'active',
            placements: placement,
            startDate: { $lte: now },
            endDate: { $gte: now },
        };
        if (city)
            filter.$or = [{ targetCities: { $size: 0 } }, { targetCities: city }];
        const campaigns = await AdCampaign_1.AdCampaign.find(filter)
            .populate('advertiserId', 'businessName email phone')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        res.json(campaigns.map(c => ({ ...c, id: c._id, advertiser: c.advertiserId })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/ads/impression — fire-and-forget impression tracking
router.post('/impression', async (req, res) => {
    try {
        await AdCampaign_1.AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { impressions: 1 } });
        res.json({ ok: true });
    }
    catch {
        res.json({ ok: false }); // never block the client
    }
});
// POST /api/ads/click — click tracking
router.post('/click', async (req, res) => {
    try {
        await AdCampaign_1.AdCampaign.findByIdAndUpdate(req.body.campaignId, { $inc: { clicks: 1 } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─── Admin routes ─────────────────────────────────────────────
// GET /api/ads/admin/campaigns
router.get('/admin/campaigns', auth_1.authenticate, auth_1.requireAdmin, async (_req, res) => {
    try {
        const campaigns = await AdCampaign_1.AdCampaign.find()
            .populate('advertiserId', 'businessName email phone')
            .sort({ createdAt: -1 })
            .lean();
        res.json(campaigns.map(c => ({ ...c, id: c._id, advertiser: c.advertiserId })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/ads/admin/campaigns
router.post('/admin/campaigns', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const campaign = await AdCampaign_1.AdCampaign.create({ ...req.body, status: 'pending', impressions: 0, clicks: 0 });
        res.status(201).json({ ...campaign.toObject(), id: campaign._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/ads/admin/campaigns/:id
router.patch('/admin/campaigns/:id', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const campaign = await AdCampaign_1.AdCampaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ ...campaign.toObject(), id: campaign._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/ads/admin/campaigns/:id/status
router.patch('/admin/campaigns/:id/status', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const update = { status };
        if (status === 'active') {
            update.approvedBy = req.user.userId;
            update.approvedAt = new Date();
        }
        await AdCampaign_1.AdCampaign.findByIdAndUpdate(req.params.id, update);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// DELETE /api/ads/admin/campaigns/:id
router.delete('/admin/campaigns/:id', auth_1.authenticate, auth_1.requireAdmin, async (_req, res) => {
    try {
        await AdCampaign_1.AdCampaign.findByIdAndDelete(_req.params.id);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/ads/admin/advertisers
router.get('/admin/advertisers', auth_1.authenticate, auth_1.requireAdmin, async (_req, res) => {
    try {
        const advertisers = await Advertiser_1.Advertiser.find().sort({ createdAt: -1 }).lean();
        res.json(advertisers.map(a => ({ ...a, id: a._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/ads/admin/advertisers
router.post('/admin/advertisers', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const advertiser = await Advertiser_1.Advertiser.create(req.body);
        res.status(201).json({ ...advertiser.toObject(), id: advertiser._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// DELETE /api/ads/admin/advertisers/:id
router.delete('/admin/advertisers/:id', auth_1.authenticate, auth_1.requireAdmin, async (_req, res) => {
    try {
        await Advertiser_1.Advertiser.findByIdAndDelete(_req.params.id);
        await AdCampaign_1.AdCampaign.deleteMany({ advertiserId: _req.params.id });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/ads/admin/stats
router.get('/admin/stats', auth_1.authenticate, auth_1.requireAdmin, async (_req, res) => {
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
});
exports.default = router;
