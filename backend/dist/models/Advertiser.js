"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Advertiser = void 0;
const mongoose_1 = require("mongoose");
const advertiserSchema = new mongoose_1.Schema({
    businessName: { type: String, required: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    website: { type: String },
    industry: { type: String },
    notes: { type: String },
}, { timestamps: true });
exports.Advertiser = (0, mongoose_1.model)('Advertiser', advertiserSchema);
