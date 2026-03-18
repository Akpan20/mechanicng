"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdCampaign = void 0;
const mongoose_1 = require("mongoose");
const adCampaignSchema = new mongoose_1.Schema({
    advertiserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Advertiser', required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'active', 'approved', 'paused', 'rejected', 'expired', 'ended'], default: 'pending' },
    format: { type: String, enum: ['banner', 'card', 'inline', 'spotlight'], required: true },
    placements: [{ type: String }],
    headline: { type: String, required: true },
    bodyText: { type: String },
    ctaLabel: { type: String, required: true },
    ctaUrl: { type: String, required: true },
    imageUrl: { type: String },
    logoUrl: { type: String },
    backgroundColor: { type: String, default: '#1a1a2e' },
    accentColor: { type: String, default: '#f97316' },
    targetCities: [{ type: String }],
    targetServices: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priceNgn: { type: Number, required: true, min: 0 },
    billingType: { type: String, enum: ['flat', 'cpm', 'cpc'], default: 'flat' },
    cpmRate: { type: Number },
    cpcRate: { type: Number },
    budgetCap: { type: Number },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    adminNotes: { type: String },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
}, { timestamps: true });
adCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
adCampaignSchema.index({ placements: 1, status: 1 });
exports.AdCampaign = (0, mongoose_1.model)('AdCampaign', adCampaignSchema);
