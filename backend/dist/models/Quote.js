"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quote = void 0;
const mongoose_1 = require("mongoose");
const quoteSchema = new mongoose_1.Schema({
    mechanicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Mechanic', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    service: { type: String, required: true },
    note: { type: String },
    status: { type: String, enum: ['pending', 'responded', 'closed'], default: 'pending' },
}, { timestamps: true });
quoteSchema.index({ mechanicId: 1, createdAt: -1 });
exports.Quote = (0, mongoose_1.model)('Quote', quoteSchema);
