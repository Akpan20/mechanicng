"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviews = getReviews;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
const mongoose_1 = __importDefault(require("mongoose"));
const Review_1 = require("../models/Review");
const Mechanic_1 = require("../models/Mechanic");
const User_1 = require("../models/User");
// ── Helper ────────────────────────────────────────────────────
async function recalculateMechanicRating(mechanicId) {
    const allReviews = await Review_1.Review.find({ mechanicId: new mongoose_1.default.Types.ObjectId(mechanicId) });
    const reviewCount = allReviews.length;
    const rating = reviewCount > 0
        ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
        : 0;
    await Mechanic_1.Mechanic.findByIdAndUpdate(mechanicId, { rating, reviewCount }, { new: true });
}
// ── GET /api/reviews/:mechanicId ──────────────────────────────
async function getReviews(req, res) {
    try {
        const { mechanicId } = req.params; // ← matches /:mechanicId
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            Review_1.Review.find({ mechanicId: new mongoose_1.default.Types.ObjectId(mechanicId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review_1.Review.countDocuments({ mechanicId: new mongoose_1.default.Types.ObjectId(mechanicId) }),
        ]);
        res.json({
            reviews: reviews.map(r => ({ ...r, id: r._id })),
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ── POST /api/reviews/:mechanicId ─────────────────────────────
async function createReview(req, res) {
    try {
        const { mechanicId } = req.params; // ← matches /:mechanicId
        const { rating, comment } = req.body;
        if (!rating || !comment) {
            res.status(400).json({ error: 'rating and comment are required' });
            return;
        }
        if (rating < 1 || rating > 5) {
            res.status(400).json({ error: 'rating must be between 1 and 5' });
            return;
        }
        // Derive userName from DB — never trust the client
        const user = await User_1.User.findById(req.user.userId).lean();
        const userName = user?.fullName || req.user.email || 'Anonymous';
        const existing = await Review_1.Review.findOne({
            mechanicId: new mongoose_1.default.Types.ObjectId(mechanicId),
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
        });
        if (existing) {
            res.status(409).json({ error: 'You have already reviewed this mechanic' });
            return;
        }
        const review = await Review_1.Review.create({
            mechanicId: new mongoose_1.default.Types.ObjectId(mechanicId),
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
            userName,
            rating,
            comment,
        });
        await recalculateMechanicRating(mechanicId);
        res.status(201).json({ ...review.toObject(), id: review._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ── PATCH /api/reviews/:reviewId ──────────────────────────────
async function updateReview(req, res) {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const review = await Review_1.Review.findById(reviewId);
        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        if (review.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                res.status(400).json({ error: 'rating must be between 1 and 5' });
                return;
            }
            review.rating = rating;
        }
        if (comment !== undefined)
            review.comment = comment;
        await review.save();
        await recalculateMechanicRating(review.mechanicId.toString());
        res.json({ ...review.toObject(), id: review._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// ── DELETE /api/reviews/:reviewId ─────────────────────────────
async function deleteReview(req, res) {
    try {
        const { reviewId } = req.params;
        const review = await Review_1.Review.findById(reviewId);
        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        if (review.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const mechanicId = review.mechanicId.toString();
        await review.deleteOne();
        await recalculateMechanicRating(mechanicId);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
