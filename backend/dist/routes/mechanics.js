"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const mechanicsController_1 = require("../controllers/mechanicsController");
const router = (0, express_1.Router)();
// Public
router.get('/', mechanicsController_1.searchMechanics);
router.get('/:id/reviews', mechanicsController_1.getReviews);
router.get('/:id', mechanicsController_1.getMechanicById);
// Authenticated — named routes BEFORE /:id
router.get('/me', auth_1.authenticate, mechanicsController_1.getMyMechanic); // ← add this
router.get('/user/:userId', auth_1.authenticate, mechanicsController_1.getMechanicByUserId);
router.post('/', auth_1.authenticate, mechanicsController_1.createMechanic);
router.post('/:id/reviews', auth_1.authenticate, mechanicsController_1.createReview);
router.patch('/:id', auth_1.authenticate, mechanicsController_1.updateMechanic);
// Admin
router.patch('/:id/status', auth_1.authenticate, auth_1.requireAdmin, mechanicsController_1.updateMechanicStatus);
exports.default = router;
