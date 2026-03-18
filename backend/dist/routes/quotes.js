"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Quote_1 = require("../models/Quote");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/quotes — public (anyone can request a quote)
router.post('/', async (req, res) => {
    try {
        const quote = await Quote_1.Quote.create({
            mechanicId: req.body.mechanicId,
            customerName: req.body.customerName,
            customerPhone: req.body.customerPhone,
            customerEmail: req.body.customerEmail,
            service: req.body.service,
            note: req.body.note,
            status: 'pending',
        });
        res.status(201).json({ ...quote.toObject(), id: quote._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/quotes/mechanic/:mechanicId — mechanic sees their own quotes
router.get('/mechanic/:mechanicId', auth_1.authenticate, auth_1.requireMechanic, async (req, res) => {
    try {
        const quotes = await Quote_1.Quote.find({ mechanicId: req.params.mechanicId })
            .sort({ createdAt: -1 }).lean();
        res.json(quotes.map(q => ({ ...q, id: q._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/quotes/:id/status
router.patch('/:id/status', auth_1.authenticate, auth_1.requireMechanic, async (req, res) => {
    try {
        await Quote_1.Quote.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
