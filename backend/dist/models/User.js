"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// src/models/User.ts
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'mechanic', 'admin'], default: 'user' },
    avatarUrl: { type: String },
    mechanicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Mechanic' },
    resetToken: { type: String, select: false }, // hashed — never expose to client
    resetTokenExpiry: { type: Date, select: false },
}, { timestamps: true });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    this.password = await bcryptjs_1.default.hash(this.password, 12);
    next();
});
userSchema.methods.comparePassword = function (candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
};
exports.User = (0, mongoose_1.model)('User', userSchema);
