"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reviewController_1 = require("../controllers/reviewController");
// routes/reviews.ts
const router = (0, express_1.Router)();
// GET  /api/reviews/:mechanicId
router.get('/:mechanicId', reviewController_1.getReviews);
// POST /api/reviews/:mechanicId
router.post('/:mechanicId', auth_1.authenticate, reviewController_1.createReview);
// PATCH  /api/reviews/:reviewId
router.patch('/:reviewId', auth_1.authenticate, reviewController_1.updateReview);
// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', auth_1.authenticate, reviewController_1.deleteReview);
exports.default = router;
