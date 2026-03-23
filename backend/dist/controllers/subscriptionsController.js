"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscription = getSubscription;
exports.paystackWebhook = paystackWebhook;
const crypto_1 = __importDefault(require("crypto"));
const Subscription_1 = require("../models/Subscription");
const Mechanic_1 = require("../models/Mechanic");
async function getSubscription(req, res) {
    try {
        const sub = await Subscription_1.Subscription.findOne({
            mechanicId: req.params.mechanicId,
            status: 'active',
        }).lean();
        if (!sub) {
            res.status(404).json({ error: 'No active subscription' });
            return;
        }
        res.json({ ...sub, id: sub._id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function paystackWebhook(req, res) {
    try {
        // Verify Paystack signature
        const secret = process.env.PAYSTACK_SECRET_KEY ?? '';
        const hash = crypto_1.default
            .createHmac('sha512', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
        const { event, data } = req.body;
        // Handle subscription creation or payment success
        if (event === 'subscription.create' || event === 'charge.success') {
            const mechanicId = data.metadata?.mechanic_id;
            const plan = data.metadata?.plan ?? 'standard';
            if (mechanicId) {
                // Deactivate any previous subscriptions for this mechanic
                await Subscription_1.Subscription.updateMany({ mechanicId, status: 'active' }, { status: 'expired' });
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
        // Handle subscription disable (cancelled)
        if (event === 'subscription.disable') {
            await Subscription_1.Subscription.findOneAndUpdate({ paystackSubscriptionCode: data.subscription_code }, { status: 'cancelled' });
            // Downgrade mechanic to free
            const sub = await Subscription_1.Subscription.findOne({ paystackSubscriptionCode: data.subscription_code });
            if (sub)
                await Mechanic_1.Mechanic.findByIdAndUpdate(sub.mechanicId, { plan: 'free' });
        }
        // Handle payment failure
        if (event === 'invoice.payment_failed') {
            await Subscription_1.Subscription.findOneAndUpdate({ paystackSubscriptionCode: data.subscription_code }, { status: 'expired' });
        }
        res.json({ received: true });
    }
    catch (err) {
        // Always return 200 to Paystack to prevent retries on our own errors
        console.error('Webhook error:', err.message);
        res.json({ received: true });
    }
}
