"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = require("./lib/db");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const mechanics_1 = __importDefault(require("./routes/mechanics"));
const adminMechanics_1 = __importDefault(require("./routes/adminMechanics"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const ads_1 = __importDefault(require("./routes/ads"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
// ─── Security & logging ───────────────────────────────────────
app.use((0, helmet_1.default)());
// ✅ FIX: Use CLIENT_URL env var – must match your frontend origin exactly.
//    Set it in Render as: CLIENT_URL = https://mechanicng-frontnd.onrender.com
const allowedOrigin = process.env.CLIENT_URL ?? 'http://localhost:5173';
console.log(`CORS allowing origin: ${allowedOrigin}`);
app.use((0, cors_1.default)({
    origin: allowedOrigin,
    credentials: true, // required if you send cookies / authorization headers
}));
app.use((0, morgan_1.default)('dev'));
// Raw body needed for Paystack webhook signature verification
app.use('/api/subscriptions/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json({ limit: '10mb' }));
// Rate limiting
app.use('/api/auth', (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests' } }));
app.use('/api', (0, express_rate_limit_1.default)({ windowMs: 1 * 60 * 1000, max: 200 }));
// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/mechanics', mechanics_1.default);
app.use('/api/admin', adminMechanics_1.default);
app.use('/api/quotes', quotes_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/ads', ads_1.default);
app.use('/api/reviews', reviews_1.default);
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
// ─── Error handler ────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ─── Start ────────────────────────────────────────────────────
(0, db_1.connectDB)().then(() => {
    app.listen(PORT, () => console.log(`🚀 MechanicNG API running on port ${PORT}`));
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
