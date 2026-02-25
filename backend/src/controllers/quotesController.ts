import { Request, Response } from 'express'
import { z } from 'zod'
import { Quote } from '../models/Quote'
import { AuthRequest } from '../middleware/auth'

const createQuoteSchema = z.object({
  mechanicId:    z.string().min(1),
  customerName:  z.string().min(2),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email().optional(),
  service:       z.string().min(2),
  note:          z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'responded', 'closed']),
})

export async function submitQuote(req: Request, res: Response): Promise<void> {
  try {
    const body  = createQuoteSchema.parse(req.body)
    const quote = await Quote.create({ ...body, status: 'pending' })
    res.status(201).json({ ...quote.toObject(), id: quote._id })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function getQuotesByMechanic(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quotes = await Quote.find({ mechanicId: req.params.mechanicId })
      .sort({ createdAt: -1 })
      .lean()
    res.json(quotes.map(q => ({ ...q, id: q._id })))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function updateQuoteStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status } = updateStatusSchema.parse(req.body)
    const quote      = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return }
    res.json({ success: true, status: quote.status })
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: (err as Error).message })
  }
}
