"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri)
        throw new Error('MONGODB_URI is not set');
    mongoose_1.default.set('toJSON', {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id;
            ret.created_at = ret.createdAt;
            ret.updated_at = ret.updatedAt;
            ret.review_count = ret.reviewCount;
            delete ret._id;
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
            delete ret.reviewCount;
            return ret;
        }
    });
    mongoose_1.default.connection.on('connected', () => console.log('✅ MongoDB connected'));
    mongoose_1.default.connection.on('error', (err) => console.error('❌ MongoDB error:', err));
    await mongoose_1.default.connect(uri);
}
