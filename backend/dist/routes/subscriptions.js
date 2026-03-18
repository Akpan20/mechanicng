"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Subscription_1 = require("../models/Subscription");
const Mechanic_1 = require("../models/Mechanic");
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
// GET /api/subscriptions/:mechanicId
router.get('/:mechanicId', auth_1.authenticate, async (req, res) => {
    try {
        const sub = await Subscription_1.Subscription.findOne({ mechanicId: req.params.mechanicId, status: 'active' }).lean();
        if (!sub) {
            res.status(404).json({ error: 'No active subscription' });
            return;
        }
        res.json({ ...sub, id: sub._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/subscriptions/webhook — Paystack webhook
router.post('/webhook', async (req, res) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY ?? '';
        const hash = crypto_1.default.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
        const { event, data } = req.body;
        if (event === 'subscription.create' || event === 'charge.success') {
            const mechanicId = data.metadata?.mechanic_id;
            const plan = data.metadata?.plan ?? 'standard';
            if (mechanicId) {
                await Subscription_1.Subscription.create({
                    mechanicId,
                    plan,
                    status: 'active',
                    paystackSubscriptionCode: data.subscription_code,
                    paystackCustomerCode: data.customer?.customer_code,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
                await Mechanic_1.Mechanic.findByIdAndUpdate(mechanicId, { plan });
            }
        }
        if (event === 'subscription.disable') {
            await Subscription_1.Subscription.findOneAndUpdate({ paystackSubscriptionCode: data.subscription_code }, { status: 'cancelled' });
        }
        res.json({ received: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
