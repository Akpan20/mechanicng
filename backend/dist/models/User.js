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
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false, // never returned by default
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'mechanic', 'admin'],
        default: 'user',
    },
    referredBy: {
        type: String,
        default: null,
    },
    avatarUrl: {
        type: String,
    },
    mechanicId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Mechanic',
    },
    resetToken: {
        type: String,
        select: false, // hashed token, never exposed
    },
    resetTokenExpiry: {
        type: Date,
        select: false,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            // Cast to any to allow deletion of required fields
            const obj = ret;
            delete obj.password;
            delete obj.resetToken;
            delete obj.resetTokenExpiry;
            return obj;
        },
    },
});
// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ referredBy: 1 });
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Instance method to compare passwords
userSchema.methods.comparePassword = function (candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
};
exports.User = (0, mongoose_1.model)('User', userSchema);
