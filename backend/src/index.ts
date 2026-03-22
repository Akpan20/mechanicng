import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { connectDB } from './lib/db'
import { errorHandler } from './middleware/errorHandler'
import type { AuthRequest } from './middleware/auth'
import authRoutes           from './routes/auth'
import mechanicsRoutes      from './routes/mechanics'
import adminMechanicsRoutes from './routes/adminMechanics'
import quotesRoutes         from './routes/quotes'
import subscriptionsRoutes  from './routes/subscriptions'
import adsRoutes            from './routes/ads'
import reviewsRouter        from './routes/reviews'

const app  = express()
const PORT = process.env.PORT ?? 4000

// ─── Trust proxy (required on Render) ────────────────────────
app.set('trust proxy', 1)
app.set('etag', false)

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigin = process.env.CLIENT_URL ?? 'http://localhost:5173'
console.log(`CORS allowing origin: ${allowedOrigin}`)

const corsOptions: cors.CorsOptions = {
  origin:         allowedOrigin,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

// ─── Security headers ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:              ["'self'"],
      scriptSrc:               ["'self'", "'unsafe-inline'", 'pagead2.googlesyndication.com'],
      styleSrc:                ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc:                 ["'self'", 'fonts.gstatic.com'],
      imgSrc:                  ["'self'", 'data:', 'blob:', '*.cloudinary.com', '*.openstreetmap.org', '*.tile.openstreetmap.org'],
      connectSrc:              ["'self'", 'https://mechanicng-backend.onrender.com', 'https://api.paystack.co'],
      frameSrc:                ["'none'"],
      objectSrc:               ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // required for Leaflet map tiles
}))

// ─── Logging ──────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Raw body for Paystack webhook ────────────────────────────
// Must come BEFORE any JSON parser
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }))

// ─── Body parsers ─────────────────────────────────────────────
app.use('/api/auth',      express.json({ limit: '10kb'  })) // tight limit on auth
app.use('/api/mechanics', express.json({ limit: '1mb'   })) // allows photo URLs
app.use(express.json({ limit: '100kb' }))                   // default for everything else

// ─── NoSQL injection protection ───────────────────────────────
// Must come AFTER body parsers
app.use(mongoSanitize({ replaceWith: '_' }))

// ─── Rate limiting ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs:     15 * 60 * 1000,
  max:          10,
  keyGenerator: (req) => req.ip + (req.body?.email ?? ''),
  message:      { error: 'Too many attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
})

const apiLimiter = rateLimit({
  windowMs:     1 * 60 * 1000,
  max:          200,
  keyGenerator: (req) => {
    const user = (req as AuthRequest).user
    return user ? `user_${user.userId}` : (req.ip ?? 'unknown')
  },
  message:         { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// Specific auth routes first, then global API limiter
app.use('/api/auth/login',    authLimiter)
app.use('/api/auth/signup',   authLimiter)
app.use('/api/auth/reset',    authLimiter)
app.use('/api/auth/forgot-password', authLimiter)
app.use('/api/auth/reset-password',  authLimiter)
app.use('/api',               apiLimiter)

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/mechanics',     mechanicsRoutes)
app.use('/api/admin',         adminMechanicsRoutes)
app.use('/api/quotes',        quotesRoutes)
app.use('/api/subscriptions', subscriptionsRoutes)
app.use('/api/ads',           adsRoutes)
app.use('/api/reviews',       reviewsRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// ─── Error handler (must be last) ────────────────────────────
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 MechanicNG API running on port ${PORT}`))
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})