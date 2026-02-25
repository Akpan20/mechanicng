import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { connectDB } from './lib/db'
import { errorHandler } from './middleware/errorHandler'

import authRoutes           from './routes/auth'
import mechanicsRoutes      from './routes/mechanics'
import adminMechanicsRoutes from './routes/adminMechanics'
import quotesRoutes         from './routes/quotes'
import subscriptionsRoutes  from './routes/subscriptions'
import adsRoutes            from './routes/ads'
import reviewsRouter        from './routes/reviews'

const app  = express()
const PORT = process.env.PORT ?? 4000

// ─── Security & logging ───────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }))
app.use(morgan('dev'))

// Raw body needed for Paystack webhook signature verification
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests' } }))
app.use('/api',      rateLimit({ windowMs: 1  * 60 * 1000, max: 200 }))

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/mechanics',     mechanicsRoutes)
app.use('/api/admin',         adminMechanicsRoutes)
app.use('/api/quotes',        quotesRoutes)
app.use('/api/subscriptions', subscriptionsRoutes)
app.use('/api/ads',           adsRoutes)
app.use('/api/reviews',       reviewsRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// ─── Error handler ────────────────────────────────────────────
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 MechanicNG API running on http://localhost:${PORT}`))
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})