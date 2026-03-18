"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    mechanicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Mechanic', required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
}, { timestamps: true });
reviewSchema.index({ mechanicId: 1, createdAt: -1 });
exports.Review = (0, mongoose_1.model)('Review', reviewSchema);
