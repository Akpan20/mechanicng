"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    mechanicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Mechanic', required: true },
    plan: { type: String, enum: ['free', 'standard', 'pro'], required: true },
    status: { type: String, enum: ['active', 'cancelled', 'expired', 'trialing'], default: 'active' },
    paystackSubscriptionCode: { type: String },
    paystackCustomerCode: { type: String },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
}, { timestamps: true });
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
