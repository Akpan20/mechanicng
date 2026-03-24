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
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const db_1 = require("./lib/db");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const mechanics_1 = __importDefault(require("./routes/mechanics"));
const adminMechanics_1 = __importDefault(require("./routes/adminMechanics"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const ads_1 = __importDefault(require("./routes/ads"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const affiliates_1 = __importDefault(require("./routes/affiliates"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
// ─── Trust proxy (required on Render) ────────────────────────
app.set('trust proxy', 1);
app.set('etag', false);
// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigin = process.env.CLIENT_URL ?? 'http://localhost:5173';
console.log(`CORS allowing origin: ${allowedOrigin}`);
const corsOptions = {
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
};
app.options('*', (0, cors_1.default)(corsOptions));
app.use((0, cors_1.default)(corsOptions));
// ─── Security headers ─────────────────────────────────────────
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'pagead2.googlesyndication.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:', '*.cloudinary.com', '*.openstreetmap.org', '*.tile.openstreetmap.org'],
            connectSrc: ["'self'", 'https://mechanicng-backend.onrender.com', 'https://api.paystack.co'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // required for Leaflet map tiles
}));
// ─── Logging ──────────────────────────────────────────────────
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// ─── Raw body for Paystack webhook ────────────────────────────
// Must come BEFORE any JSON parser
app.use('/api/subscriptions/webhook', express_1.default.raw({ type: 'application/json' }));
// ─── Body parsers ─────────────────────────────────────────────
// Apply specific limits to different routes
app.use('/api/auth', express_1.default.json({ limit: '10kb' })); // tight limit on auth
app.use('/api/notifications', notifications_1.default);
app.use('/api/mechanics', express_1.default.json({ limit: '1mb' })); // allows photo URLs
app.use(express_1.default.json({ limit: '100kb' })); // default for everything else
// ─── NoSQL injection protection ───────────────────────────────
// Must come AFTER body parsers
app.use((0, express_mongo_sanitize_1.default)({ replaceWith: '_' }));
// ─── Rate limiting ────────────────────────────────────────────
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.ip + (req.body?.email ?? ''),
    message: { error: 'Too many attempts, try again in 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 200,
    keyGenerator: (req) => {
        const user = req.user;
        return user ? `user_${user.userId}` : (req.ip ?? 'unknown');
    },
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply auth-specific limiters before the global API limiter
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/reset', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
// Global rate limiter for all /api endpoints (applies to routes registered after this)
app.use('/api', apiLimiter);
// ─── Routes ───────────────────────────────────────────────────
// All routes after this point are covered by the global rate limiter
app.use('/api/auth', auth_1.default);
app.use('/api/mechanics', mechanics_1.default);
app.use('/api/admin', adminMechanics_1.default);
app.use('/api/quotes', quotes_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/ads', ads_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/affiliates', affiliates_1.default); // moved after the global limiter
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
// ─── Error handler (must be last) ────────────────────────────
app.use(errorHandler_1.errorHandler);
// ─── Start ────────────────────────────────────────────────────
(0, db_1.connectDB)().then(() => {
    app.listen(PORT, () => console.log(`🚀 MechanicNG API running on port ${PORT}`));
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
