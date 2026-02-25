import { Router, Response } from 'express'
import { Quote } from '../models/Quote'
import { authenticate, requireMechanic, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/quotes — public (anyone can request a quote)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quote = await Quote.create({
      mechanicId:    req.body.mechanicId,
      customerName:  req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerEmail: req.body.customerEmail,
      service:       req.body.service,
      note:          req.body.note,
      status:        'pending',
    })
    res.status(201).json({ ...quote.toObject(), id: quote._id })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/quotes/mechanic/:mechanicId — mechanic sees their own quotes
router.get('/mechanic/:mechanicId', authenticate, requireMechanic, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotes = await Quote.find({ mechanicId: req.params.mechanicId })
      .sort({ createdAt: -1 }).lean()
    res.json(quotes.map(q => ({ ...q, id: q._id })))
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PATCH /api/quotes/:id/status
router.patch('/:id/status', authenticate, requireMechanic, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Quote.findByIdAndUpdate(req.params.id, { status: req.body.status })
    res.json({ success: true })
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
