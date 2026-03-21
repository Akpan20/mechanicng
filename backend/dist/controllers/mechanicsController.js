"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMechanics = searchMechanics;
exports.getMechanicById = getMechanicById;
exports.getMechanicByUserId = getMechanicByUserId;
exports.createMechanic = createMechanic;
exports.updateMechanic = updateMechanic;
exports.getAllMechanicsAdmin = getAllMechanicsAdmin;
exports.updateMechanicStatus = updateMechanicStatus;
exports.getReviews = getReviews;
exports.createReview = createReview;
const zod_1 = require("zod");
const Mechanic_1 = require("../models/Mechanic");
const Review_1 = require("../models/Review");
const createMechanicSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    type: zod_1.z.enum(['shop', 'mobile']),
    phone: zod_1.z.string().min(7),
    whatsapp: zod_1.z.string().min(7),
    email: zod_1.z.string().email(),
    city: zod_1.z.string().min(2),
    area: zod_1.z.string().min(2),
    address: zod_1.z.string().optional(),
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
    serviceRadius: zod_1.z.number().optional(),
    services: zod_1.z.array(zod_1.z.string()).min(1),
    hours: zod_1.z.string().min(2),
    priceRange: zod_1.z.enum(['low', 'mid', 'high']),
    bio: zod_1.z.string().optional(),
});
const reviewSchema = zod_1.z.object({
    userName: zod_1.z.string().min(2),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(5),
});
// Single cast point — all callers pass toObject() or lean() results here
function serializeMechanic(m) {
    const doc = m;
    const { _id, __v, createdAt, updatedAt, reviewCount, location, ...rest } = doc;
    return {
        ...rest,
        id: _id,
        created_at: createdAt,
        updated_at: updatedAt,
        review_count: reviewCount,
        lat: location?.coordinates?.[1] ?? null,
        lng: location?.coordinates?.[0] ?? null,
    };
}
async function searchMechanics(req, res) {
    try {
        const { city, service, type, priceRange, minRating, lat, lng, radius } = req.query;
        const filter = { status: 'approved' };
        if (city)
            filter.$or = [
                { city: new RegExp(city, 'i') },
                { area: new RegExp(city, 'i') },
            ];
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
        res.json(mechanics.map(serializeMechanic));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getMechanicById(req, res) {
    try {
        const m = await Mechanic_1.Mechanic.findById(req.params.id).lean();
        if (!m) {
            res.status(404).json({ error: 'Mechanic not found' });
            return;
        }
        res.json(serializeMechanic(m));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getMechanicByUserId(req, res) {
    try {
        const m = await Mechanic_1.Mechanic.findOne({ userId: req.params.userId }).lean();
        if (!m) {
            res.status(404).json({ error: 'No listing found for this user' });
            return;
        }
        res.json(serializeMechanic(m));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function createMechanic(req, res) {
    try {
        const body = { ...req.body };
        // Normalize snake_case from frontend forms
        if (body.price_range && !body.priceRange) {
            body.priceRange = body.price_range;
            delete body.price_range;
        }
        const parsed = createMechanicSchema.parse(body);
        const { lat, lng, ...rest } = parsed;
        const mechanic = await Mechanic_1.Mechanic.create({
            ...rest,
            userId: req.user.userId,
            location: { type: 'Point', coordinates: [lng, lat] },
            status: 'pending',
            rating: 0,
            reviewCount: 0,
            verified: false,
            featured: false,
            photos: [],
        });
        res.status(201).json(serializeMechanic(mechanic.toObject()));
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
}
async function updateMechanic(req, res) {
    try {
        const mechanic = await Mechanic_1.Mechanic.findById(req.params.id);
        if (!mechanic) {
            res.status(404).json({ error: 'Mechanic not found' });
            return;
        }
        const isOwner = mechanic.userId.toString() === req.user.userId;
        if (!isOwner && req.user.role !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const body = { ...req.body };
        // Normalize snake_case from frontend forms
        if (body.price_range && !body.priceRange) {
            body.priceRange = body.price_range;
            delete body.price_range;
        }
        if (body.lat != null && body.lng != null) {
            body.location = { type: 'Point', coordinates: [body.lng, body.lat] };
            delete body.lat;
            delete body.lng;
        }
        // Prevent overwriting protected fields
        const protected_ = ['status', 'rating', 'reviewCount', 'verified', 'featured', 'userId'];
        protected_.forEach(f => delete body[f]);
        Object.assign(mechanic, body);
        await mechanic.save();
        res.json(serializeMechanic(mechanic.toObject()));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ─── Admin ────────────────────────────────────────────────────
async function getAllMechanicsAdmin(_req, res) {
    try {
        const mechanics = await Mechanic_1.Mechanic.find().sort({ createdAt: -1 }).lean();
        res.json(mechanics.map(serializeMechanic));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateMechanicStatus(req, res) {
    try {
        const { status } = req.body;
        const allowed = ['pending', 'approved', 'rejected', 'suspended'];
        if (!allowed.includes(status)) {
            res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
            return;
        }
        const m = await Mechanic_1.Mechanic.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!m) {
            res.status(404).json({ error: 'Mechanic not found' });
            return;
        }
        res.json({ success: true, status: m.status });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ─── Reviews ──────────────────────────────────────────────────
async function getReviews(req, res) {
    try {
        const reviews = await Review_1.Review.find({ mechanicId: req.params.id })
            .sort({ createdAt: -1 })
            .lean();
        res.json(reviews.map(r => ({ ...r, id: r._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function createReview(req, res) {
    try {
        const body = reviewSchema.parse(req.body);
        // Prevent duplicate reviews from same user
        const existing = await Review_1.Review.findOne({ mechanicId: req.params.id, userId: req.user.userId });
        if (existing) {
            res.status(409).json({ error: 'You have already reviewed this mechanic' });
            return;
        }
        const review = await Review_1.Review.create({
            mechanicId: req.params.id,
            userId: req.user.userId,
            ...body,
        });
        // Recalculate average rating
        const all = await Review_1.Review.find({ mechanicId: req.params.id });
        const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
        await Mechanic_1.Mechanic.findByIdAndUpdate(req.params.id, {
            rating: Math.round(avg * 10) / 10,
            reviewCount: all.length,
        });
        res.status(201).json({ ...review.toObject(), id: review._id });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
}
