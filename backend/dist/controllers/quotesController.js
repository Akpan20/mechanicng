"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuote = submitQuote;
exports.getQuotesByMechanic = getQuotesByMechanic;
exports.updateQuoteStatus = updateQuoteStatus;
const zod_1 = require("zod");
const Quote_1 = require("../models/Quote");
const createQuoteSchema = zod_1.z.object({
    mechanicId: zod_1.z.string().min(1),
    customerName: zod_1.z.string().min(2),
    customerPhone: zod_1.z.string().min(7),
    customerEmail: zod_1.z.string().email().optional(),
    service: zod_1.z.string().min(2),
    note: zod_1.z.string().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'responded', 'closed']),
});
async function submitQuote(req, res) {
    try {
        const body = createQuoteSchema.parse(req.body);
        const quote = await Quote_1.Quote.create({ ...body, status: 'pending' });
        res.status(201).json({ ...quote.toObject(), id: quote._id });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
}
async function getQuotesByMechanic(req, res) {
    try {
        const quotes = await Quote_1.Quote.find({ mechanicId: req.params.mechanicId })
            .sort({ createdAt: -1 })
            .lean();
        res.json(quotes.map(q => ({ ...q, id: q._id })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateQuoteStatus(req, res) {
    try {
        const { status } = updateStatusSchema.parse(req.body);
        const quote = await Quote_1.Quote.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!quote) {
            res.status(404).json({ error: 'Quote not found' });
            return;
        }
        res.json({ success: true, status: quote.status });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
}
