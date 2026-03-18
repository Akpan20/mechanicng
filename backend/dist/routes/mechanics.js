"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Mechanic_1 = require("../models/Mechanic");
const Review_1 = require("../models/Review");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/mechanics — public search
router.get('/', async (req, res) => {
    try {
        const { city, service, type, priceRange, minRating, lat, lng, radius } = req.query;
        const filter = { status: 'approved' };
        if (city)
            filter.$or = [{ city: new RegExp(city, 'i') }, { area: new RegExp(city, 'i') }];
        if (service)
            filter.services = service;
        if (type)
            filter.type = type;
        if (priceRange)
            filter.priceRange = priceRange;
        if (minRating)
            filter.rating = { $gte: Number(minRating) };
        if (lat && lng) {
            filter.location = {
                $near: {
                    $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
                    $maxDistance: Number(radius ?? 50000),
                },
            };
        }
        const mechanics = await Mechanic_1.Mechanic.find(filter)
            .sort({ plan: -1, rating: -1 })
            .limit(100)
            .lean();
        res.json(mechanics.map(m => ({ ...m, id: m._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── Named routes MUST come before /:id ───────────────────────
// GET /api/mechanics/me
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        console.log('req.user:', req.user);
        const m = await Mechanic_1.Mechanic.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId)
        }).lean();
        console.log('found mechanic:', m);
        if (!m) {
            res.status(404).json({ error: 'No listing found' });
            return;
        }
        res.json({ ...m, id: m._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/mechanics/admin/all
router.get('/admin/all', auth_1.authenticate, auth_1.requireAdmin, async (_req, res) => {
    try {
        const mechanics = await Mechanic_1.Mechanic.find().sort({ createdAt: -1 }).lean();
        res.json(mechanics.map(m => ({ ...m, id: m._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/mechanics/user/:userId
// GET /user/:userId
router.get('/user/:userId', auth_1.authenticate, async (req, res) => {
    try {
        const m = await Mechanic_1.Mechanic.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.params.userId)
        }).lean();
        if (!m) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json({ ...m, id: m._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── Param routes AFTER all named routes ──────────────────────
// GET /api/mechanics/:id
router.get('/:id', async (req, res) => {
    try {
        const m = await Mechanic_1.Mechanic.findById(req.params.id).lean();
        if (!m) {
            res.status(404).json({ error: 'Mechanic not found' });
            return;
        }
        res.json({ ...m, id: m._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/mechanics
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const body = req.body;
        if (!body.priceRange || !['low', 'mid', 'high'].includes(body.priceRange)) {
            res.status(400).json({ error: 'priceRange is required and must be low, mid, or high' });
            return;
        }
        const mechanic = await Mechanic_1.Mechanic.create({
            ...body,
            userId: req.user.userId,
            location: { type: 'Point', coordinates: [body.lng, body.lat] },
            status: 'pending',
            rating: 0,
            reviewCount: 0,
            verified: false,
            featured: false,
            photos: [],
        });
        res.status(201).json({ ...mechanic.toObject(), id: mechanic._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/mechanics/:id/status  — must be before /:id PATCH
router.patch('/:id/status', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await Mechanic_1.Mechanic.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/mechanics/:id
router.patch('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const mechanic = await Mechanic_1.Mechanic.findById(req.params.id);
        if (!mechanic) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        if (mechanic.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const body = req.body;
        if (body.lat && body.lng) {
            body.location = { type: 'Point', coordinates: [body.lng, body.lat] };
        }
        Object.assign(mechanic, body);
        await mechanic.save();
        res.json({ ...mechanic.toObject(), id: mechanic._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── Reviews ───────────────────────────────────────────────────
// GET /api/mechanics/:id/reviews
router.get('/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review_1.Review.find({ mechanicId: req.params.id }).sort({ createdAt: -1 }).lean();
        res.json(reviews.map(r => ({ ...r, id: r._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/mechanics/:id/reviews
router.post('/:id/reviews', auth_1.authenticate, async (req, res) => {
    try {
        const review = await Review_1.Review.create({
            mechanicId: req.params.id,
            userId: req.user.userId,
            userName: req.body.userName,
            rating: req.body.rating,
            comment: req.body.comment,
        });
        const allReviews = await Review_1.Review.find({ mechanicId: req.params.id });
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await Mechanic_1.Mechanic.findByIdAndUpdate(req.params.id, {
            rating: Math.round(avg * 10) / 10,
            reviewCount: allReviews.length,
        });
        res.status(201).json({ ...review.toObject(), id: review._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
